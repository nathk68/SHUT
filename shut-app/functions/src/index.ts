import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import {
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import Mux from "@mux/mux-node";
import {Resend} from "resend";

admin.initializeApp();

const muxTokenId = defineSecret("MUX_TOKEN_ID");
const muxTokenSecret =
  defineSecret("MUX_TOKEN_SECRET");
const resendApiKey = defineSecret("RESEND_API_KEY");

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 10,
});

const RTMP = "rtmp://global-live.mux.com:5222/app";

/**
 * Create a Mux client using runtime secrets.
 * @return {Mux} Mux client instance.
 */
function getMux(): Mux {
  return new Mux({
    tokenId: muxTokenId.value(),
    tokenSecret: muxTokenSecret.value(),
  });
}

export const createLiveStream = onCall(
  {secrets: [muxTokenId, muxTokenSecret]},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated", "Login required"
      );
    }

    const uid = request.auth.uid;
    const userDoc = await admin.firestore()
      .doc(`users/${uid}`).get();
    if (userDoc.data()?.role !== "broadcaster") {
      throw new HttpsError(
        "permission-denied",
        "Broadcaster role required"
      );
    }

    const {eventId, record} = request.data;
    const shouldRecord = record === true;
    console.log("createLiveStream called for eventId:", eventId,
      "record:", shouldRecord);
    console.log("MUX_TOKEN_ID length:", muxTokenId.value()?.length);

    const mux = getMux();

    let liveStream;
    try {
      const createParams: any = {
        playback_policy: ["public"],
        new_asset_settings: {
          playback_policy: ["public"],
        },
        latency_mode: "low",
        reconnect_window: 60,
        max_continuous_duration: 43200,
      };
      // Enable recording — Mux will auto-create an Asset when stream ends
      if (shouldRecord) {
        createParams.new_asset_settings.mp4_support = "standard";
      }
      liveStream = await mux.video.liveStreams.create(createParams);
    } catch (muxError: any) {
      console.error("Mux API error:", JSON.stringify({
        message: muxError?.message,
        status: muxError?.status,
        error: muxError?.error,
      }));
      throw new HttpsError(
        "internal",
        `Mux error: ${muxError?.message ?? "unknown"}`
      );
    }

    const playbackId =
      liveStream.playback_ids?.[0]?.id;
    const playbackUrl =
      `https://stream.mux.com/${playbackId}.m3u8`;

    const eventUpdate: Record<string, any> = {
      muxLiveStreamId: liveStream.id,
      muxStreamKey: liveStream.stream_key,
      muxRtmpUrl: RTMP,
      playbackUrl,
    };
    if (shouldRecord) eventUpdate.record = true;
    await admin.firestore()
      .doc(`events/${eventId}`).update(eventUpdate);

    return {
      streamKey: liveStream.stream_key,
      rtmpUrl: RTMP,
      playbackId,
      playbackUrl,
    };
  }
);

export const getLiveStreamStatus = onCall(
  {secrets: [muxTokenId, muxTokenSecret]},
  async (request) => {
    const {muxLiveStreamId} = request.data;
    const mux = getMux();
    const stream = await mux.video.liveStreams
      .retrieve(muxLiveStreamId);
    return {
      status: stream.status,
      activeAssetId: stream.active_asset_id,
    };
  }
);

export const endLiveStream = onCall(
  {secrets: [muxTokenId, muxTokenSecret]},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated", "Login required"
      );
    }
    const {eventId} = request.data;
    const mux = getMux();

    // Look up muxLiveStreamId from the event document
    const eventDoc = await admin.firestore()
      .doc(`events/${eventId}`).get();
    const muxLiveStreamId = eventDoc.data()?.muxLiveStreamId;
    if (muxLiveStreamId) {
      await mux.video.liveStreams.disable(muxLiveStreamId);
    }

    await admin.firestore()
      .doc(`events/${eventId}`).update({
        status: "ended",
        actualEndTime: admin.firestore
          .FieldValue.serverTimestamp(),
      });
    return {success: true};
  }
);

export const muxWebhook = onRequest(
  async (req, res) => {
    const {type, data} = req.body;
    const ts = admin.firestore
      .FieldValue.serverTimestamp();

    // ── Live stream events ──────────────────────────
    if (
      type === "video.live_stream.active" ||
      type === "video.live_stream.idle"
    ) {
      const streamId = data?.id;
      const eventsSnap = await admin.firestore()
        .collection("events")
        .where("muxLiveStreamId", "==", streamId)
        .limit(1)
        .get();

      if (eventsSnap.empty) {
        res.status(200).send("OK");
        return;
      }

      const eventDoc = eventsSnap.docs[0];

      if (type === "video.live_stream.active") {
        await eventDoc.ref.update({
          status: "live",
          actualStartTime: ts,
        });
      } else {
        await eventDoc.ref.update({
          status: "ended",
          actualEndTime: ts,
        });
      }
      res.status(200).send("OK");
      return;
    }

    // ── Asset ready (recording finished encoding) ───
    if (type === "video.asset.ready") {
      const asset = data;
      // asset.live_stream_id links back to the original stream
      const liveStreamId = asset?.live_stream_id;
      if (!liveStreamId) {
        res.status(200).send("OK");
        return;
      }

      const eventsSnap = await admin.firestore()
        .collection("events")
        .where("muxLiveStreamId", "==", liveStreamId)
        .limit(1)
        .get();

      if (eventsSnap.empty) {
        res.status(200).send("OK");
        return;
      }

      const eventDoc = eventsSnap.docs[0];
      const eventData = eventDoc.data();

      // Only create replay if recording was enabled
      if (!eventData?.record) {
        res.status(200).send("OK");
        return;
      }

      const assetPlaybackId =
        asset?.playback_ids?.[0]?.id;
      const assetDuration =
        Math.round(asset?.duration ?? 0);

      const playbackUrl = assetPlaybackId ?
        `https://stream.mux.com/${assetPlaybackId}.m3u8` :
        null;
      const thumbnailUrl = assetPlaybackId ?
        `https://image.mux.com/${assetPlaybackId}/thumbnail.png?width=640&height=360&time=0` :
        null;

      await admin.firestore()
        .collection("replays").add({
          userId: eventData.userId ?? null,
          eventId: eventDoc.id,
          muxAssetId: asset.id,
          playbackUrl,
          thumbnailUrl,
          duration: assetDuration,
          title: eventData.title ?? "",
          genres: [],
          trimStart: 0,
          trimEnd: 0,
          location: null,
          liveDate: null,
          status: "draft",
          createdAt: new Date().toISOString(),
          publishedAt: null,
        });

      console.log(
        "Replay created for event:",
        eventDoc.id,
        "asset:", asset.id
      );
      res.status(200).send("OK");
      return;
    }

    res.status(200).send("OK");
  }
);

// ── Welcome email ────────────────────────────

/**
 * Build the welcome HTML email.
 * @param {string} name User display name.
 * @param {string} lang Language code (fr/en).
 * @return {string} Complete HTML email string.
 */
function buildWelcomeEmail(
  name: string, lang: string
): string {
  const en = lang.startsWith("en");
  const t = en ?
    {
      title: "Welcome to SHUT",
      tagline: "Live Sound, No Compromise",
      greeting: `Hey ${name},`,
      body:
        "You\u2019re now part of the SHUT community" +
        " \u2014 the planet of live DJs. Discover" +
        " sets from around the world, follow your" +
        " favorite artists, and never miss a" +
        " live again.",
      cta: "Open SHUT",
      footer: "See you on the dancefloor.",
    } :
    {
      title: "Bienvenue sur SHUT",
      tagline: "Le son live, sans compromis",
      greeting: `Hey ${name},`,
      body:
        "Tu fais maintenant partie de la" +
        " communaut\u00e9 SHUT \u2014 la plan\u00e8te" +
        " des DJ en live. D\u00e9couvre des sets du" +
        " monde entier, suis tes artistes" +
        " pr\u00e9f\u00e9r\u00e9s et ne rate plus" +
        " jamais un live.",
      cta: "Ouvrir SHUT",
      footer: "On se retrouve sur le dancefloor.",
    };
  const yr = new Date().getFullYear();
  const lg = en ? "en" : "fr";

  // eslint-disable-next-line max-len
  const hdrBg = "background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#7c3aed 100%)";

  const lines = [
    "<!DOCTYPE html>",
    `<html lang="${lg}"><head>`,
    "<meta charset=\"utf-8\"/>",
    "<meta name=\"viewport\"" +
    " content=\"width=device-width," +
    "initial-scale=1\"/>",
    `<title>${t.title}</title></head>`,
    "<body style=\"margin:0;padding:0;" +
    "background:#0a0a0a;" +
    "font-family:-apple-system," +
    "BlinkMacSystemFont,'Segoe UI'," +
    "Roboto,sans-serif;\">",
    "<table width=\"100%\" cellpadding=\"0\"" +
    " cellspacing=\"0\"" +
    " style=\"background:#0a0a0a;\">",
    "<tr><td align=\"center\"" +
    " style=\"padding:40px 16px;\">",
    "<table width=\"100%\"" +
    " style=\"max-width:520px;" +
    "background:#141414;" +
    "border-radius:16px;" +
    "border:1px solid" +
    " rgba(255,255,255,0.08);" +
    "overflow:hidden;\">",
    // Header
    `<tr><td style="${hdrBg};` +
    "padding:48px 32px;" +
    "text-align:center;\">",
    "<div style=\"font-size:42px;" +
    "font-weight:800;color:#fff;" +
    "letter-spacing:6px;" +
    "margin-bottom:8px;\">SHUT</div>",
    "<div style=\"font-size:14px;" +
    "color:rgba(255,255,255,0.85);" +
    "letter-spacing:2px;" +
    "text-transform:uppercase;\">" +
    `${t.tagline}</div>`,
    "</td></tr>",
    // Body
    "<tr><td style=\"padding:36px 32px;\">",
    "<p style=\"color:#fff;" +
    "font-size:18px;font-weight:600;" +
    `margin:0 0 16px;">${t.greeting}</p>`,
    "<p style=\"color:" +
    "rgba(255,255,255,0.7);" +
    "font-size:15px;line-height:24px;" +
    `margin:0 0 28px;">${t.body}</p>`,
    "<table width=\"100%\"" +
    " cellpadding=\"0\" cellspacing=\"0\">",
    "<tr><td align=\"center\">",
    "<a href=\"https://shutdiffusion.com\"" +
    " style=\"display:inline-block;" +
    "background:#7c3aed;color:#fff;" +
    "text-decoration:none;" +
    "font-size:15px;font-weight:600;" +
    "padding:14px 36px;" +
    "border-radius:50px;" +
    `letter-spacing:0.5px;">${t.cta}</a>`,
    "</td></tr></table>",
    "</td></tr>",
    // Divider
    "<tr><td style=\"padding:0 32px;\">",
    "<div style=\"height:1px;" +
    "background:" +
    "rgba(255,255,255,0.08);\"></div>",
    "</td></tr>",
    // Footer
    "<tr><td style=\"padding:24px 32px;" +
    "text-align:center;\">",
    "<p style=\"color:" +
    "rgba(255,255,255,0.4);" +
    "font-size:13px;margin:0 0 4px;\">" +
    `${t.footer}</p>`,
    "<p style=\"color:" +
    "rgba(255,255,255,0.25);" +
    "font-size:11px;margin:0;\">" +
    `\u00a9 ${yr} SHUT. ` +
    "All rights reserved.</p>",
    "</td></tr></table>",
    "</td></tr></table>",
    "</body></html>",
  ];
  return lines.join("\n");
}

/**
 * Triggered when a new user document is created
 * in Firestore. Sends a welcome email via Resend.
 * @param {object} event Firestore event.
 */
export const sendWelcomeEmail = onDocumentCreated(
  {
    document: "users/{userId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    const userData = event.data?.data();
    if (!userData?.email) {
      console.log(
        "No email on new user, skipping"
      );
      return;
    }

    const displayName =
      userData.artistName ??
        userData.firstName ??
        userData.displayName ?? "DJ";

    const lang: string =
      userData.language ?? "fr";

    const resend = new Resend(
      resendApiKey.value()
    );

    const en = lang.startsWith("en");
    const subject = en ?
      "Welcome to SHUT \ud83c\udfa7" :
      "Bienvenue sur SHUT \ud83c\udfa7";

    try {
      await resend.emails.send({
        from: "SHUT <support@shutdiffusion.com>",
        to: [userData.email],
        subject,
        html: buildWelcomeEmail(
          displayName, lang
        ),
      });
      console.log(
        "Welcome email sent to:",
        userData.email
      );
    } catch (err) {
      console.error(
        "Failed to send welcome email:", err
      );
    }
  }
);
