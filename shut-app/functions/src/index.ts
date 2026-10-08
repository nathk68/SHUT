import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {
  onDocumentCreated,
  onDocumentUpdated,
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

// ── Password reset email ─────────────────────

const RESET_URL =
  "https://shutdiffusion.com/auth/reset";
const API_KEY =
  "AIzaSyBERbBRO7wL5l-7GjHGOYd10_98iwsql7A";

/**
 * Build the password reset HTML email.
 * @param {string} name User display name.
 * @param {string} link Reset link URL.
 * @param {string} lang Language code (fr/en).
 * @return {string} Complete HTML email string.
 */
function buildResetEmail(
  name: string, link: string, lang: string
): string {
  const en = lang.startsWith("en");
  const t = en ?
    {
      title: "Reset your password",
      tagline: "Password Reset",
      greeting: `Hey ${name},`,
      body:
        "We received a request to reset your" +
        " SHUT password. Click the button below" +
        " to choose a new one. This link expires" +
        " in 1 hour.",
      cta: "Reset my password",
      footer:
        "If you didn\u2019t request this," +
        " you can safely ignore this email.",
    } :
    {
      title: "R\u00e9initialise ton mot de passe",
      tagline: "R\u00e9initialisation",
      greeting: `Hey ${name},`,
      body:
        "Nous avons re\u00e7u une demande de" +
        " r\u00e9initialisation de ton mot de" +
        " passe SHUT. Clique sur le bouton" +
        " ci-dessous pour en choisir un" +
        " nouveau. Ce lien expire dans 1 heure.",
      cta: "R\u00e9initialiser mon mot de passe",
      footer:
        "Si tu n\u2019as pas fait cette demande," +
        " ignore simplement cet email.",
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
    `<a href="${link}"` +
    " style=\"display:inline-block;" +
    "background:#7c3aed;color:#fff;" +
    "text-decoration:none;" +
    "font-size:15px;font-weight:600;" +
    "padding:14px 36px;" +
    "border-radius:50px;" +
    `letter-spacing:0.5px;">${t.cta}</a>`,
    "</td></tr></table>",
    "</td></tr>",
    "<tr><td style=\"padding:0 32px;\">",
    "<div style=\"height:1px;" +
    "background:" +
    "rgba(255,255,255,0.08);\"></div>",
    "</td></tr>",
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
 * Request a password reset email.
 * Generates the link server-side and sends a
 * branded email via Resend.
 * @param {object} request Cloud Function request.
 * @return {object} Success status.
 */
export const requestPasswordReset = onCall(
  {secrets: [resendApiKey], invoker: "public"},
  async (request) => {
    const {email, lang} = request.data;
    if (!email || typeof email !== "string") {
      throw new HttpsError(
        "invalid-argument", "Email required"
      );
    }

    // Normalize email
    const normalEmail = email.trim().toLowerCase();

    // ── Rate limiting (3 resets / email / hour) ──
    const rateLimitRef = admin.firestore()
      .collection("_rateLimits")
      .doc(`reset_${normalEmail.replace(/[^a-z0-9]/g, "_")}`);

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const maxAttempts = 3;

    const rateLimitDoc = await rateLimitRef.get();
    const data = rateLimitDoc.data();

    if (data) {
      // Clean old timestamps
      const recent = (data.timestamps || [])
        .filter((ts: number) => now - ts < oneHour);

      if (recent.length >= maxAttempts) {
        throw new HttpsError(
          "resource-exhausted",
          "Too many reset attempts. " +
          "Try again in 1 hour."
        );
      }

      await rateLimitRef.set({
        timestamps: [...recent, now],
      });
    } else {
      await rateLimitRef.set({
        timestamps: [now],
      });
    }

    const userLang: string = lang ?? "fr";

    // Generate reset link via Admin SDK
    const firebaseLink = await admin.auth()
      .generatePasswordResetLink(normalEmail, {
        url: "https://shutdiffusion.com",
      });

    // Extract oobCode from Firebase link
    const url = new URL(firebaseLink);
    const oobCode = url.searchParams.get("oobCode");
    if (!oobCode) {
      throw new HttpsError(
        "internal", "Failed to generate reset link"
      );
    }

    // Build custom URL pointing to our site
    const resetLink = RESET_URL +
      "?mode=resetPassword" +
      `&oobCode=${encodeURIComponent(oobCode)}` +
      `&apiKey=${API_KEY}`;

    // Get display name for greeting
    let displayName = "DJ";
    try {
      const userRecord = await admin.auth()
        .getUserByEmail(email);
      displayName =
        userRecord.displayName ?? "DJ";
    } catch {
      // User not found — still send the email
      // (Firebase will reject the code anyway)
    }

    const resend = new Resend(
      resendApiKey.value()
    );

    const en = userLang.startsWith("en");
    const subject = en ?
      "Reset your SHUT password" :
      "R\u00e9initialise ton mot de passe SHUT";

    await resend.emails.send({
      from: "SHUT <support@shutdiffusion.com>",
      to: [email],
      subject,
      html: buildResetEmail(
        displayName, resetLink, userLang
      ),
    });

    return {success: true};
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

// ── Admin helpers ─────────────────────────────

/**
 * Assert the caller is an admin. Throws if not.
 * @param {any} request Cloud Function request.
 * @return {string} The caller's uid.
 */
async function requireAdmin(
  request: { auth?: { uid: string } }
): Promise<string> {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated", "Login required"
    );
  }
  const uid = request.auth.uid;
  const snap = await admin.firestore()
    .doc(`users/${uid}`).get();
  if (snap.data()?.role !== "admin") {
    throw new HttpsError(
      "permission-denied", "Admin role required"
    );
  }
  return uid;
}

// ── Application decision email ────────────────

/**
 * Build the application decision HTML email.
 * @param {string} name User display name.
 * @param {string} decision "approved" or "rejected".
 * @param {string} lang Language code (fr/en).
 * @return {string} Complete HTML email string.
 */
function buildApplicationEmail(
  name: string, decision: string, lang: string
): string {
  const en = lang.startsWith("en");
  const approved = decision === "approved";

  const t = approved ?
    (en ? {
      title: "Application Approved",
      tagline: "Welcome to the DJ team",
      greeting: `Hey ${name},`,
      body:
        "Great news! Your DJ application on SHUT" +
        " has been approved. You can now go live" +
        " and share your sets with the world." +
        " Restart the app to activate your DJ mode.",
      cta: "Open SHUT",
      footer: "See you behind the decks.",
    } : {
      title: "Candidature accept\u00e9e",
      tagline: "Bienvenue dans l'\u00e9quipe DJ",
      greeting: `Hey ${name},`,
      body:
        "Bonne nouvelle ! Ta candidature DJ" +
        " sur SHUT a \u00e9t\u00e9 accept\u00e9e." +
        " Tu peux maintenant lancer des lives et" +
        " partager tes sets avec le monde." +
        " Red\u00e9marre l\u2019app pour activer" +
        " ton mode DJ.",
      cta: "Ouvrir SHUT",
      footer: "On se retrouve derri\u00e8re les platines.",
    }) :
    (en ? {
      title: "Application Update",
      tagline: "Application Status",
      greeting: `Hey ${name},`,
      body:
        "Unfortunately, your DJ application on" +
        " SHUT was not accepted at this time." +
        " You can submit a new application if" +
        " you wish. If you have any questions," +
        " feel free to reach out to us at" +
        " contact@shutdiffusion.com.",
      cta: "Contact Us",
      footer:
        "Thank you for your interest in SHUT.",
    } : {
      title: "Mise \u00e0 jour candidature",
      tagline: "Statut candidature",
      greeting: `Hey ${name},`,
      body:
        "Malheureusement, ta candidature DJ sur" +
        " SHUT n\u2019a pas \u00e9t\u00e9 retenue" +
        " cette fois. Tu peux soumettre une" +
        " nouvelle candidature si tu le souhaites." +
        " Pour toute question, contacte-nous" +
        " \u00e0 contact@shutdiffusion.com.",
      cta: "Nous contacter",
      footer:
        "Merci pour ton int\u00e9r\u00eat pour SHUT.",
    });

  const ctaUrl = approved ?
    "https://shutdiffusion.com" :
    "mailto:contact@shutdiffusion.com";
  const yr = new Date().getFullYear();
  const lg = en ? "en" : "fr";

  const hdrBg = approved ?
    "background:linear-gradient(135deg," +
    "#16a34a 0%,#22c55e 50%,#16a34a 100%)" :
    "background:linear-gradient(135deg," +
    "#7c3aed 0%,#a855f7 50%,#7c3aed 100%)";

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
    `<a href="${ctaUrl}"` +
    " style=\"display:inline-block;" +
    `background:${approved ? "#16a34a" : "#7c3aed"};` +
    "color:#fff;" +
    "text-decoration:none;" +
    "font-size:15px;font-weight:600;" +
    "padding:14px 36px;" +
    "border-radius:50px;" +
    `letter-spacing:0.5px;">${t.cta}</a>`,
    "</td></tr></table>",
    "</td></tr>",
    "<tr><td style=\"padding:0 32px;\">",
    "<div style=\"height:1px;" +
    "background:" +
    "rgba(255,255,255,0.08);\"></div>",
    "</td></tr>",
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

// ── Review DJ / DA application ────────────────

export const reviewApplication = onCall(
  {secrets: [resendApiKey]},
  async (request) => {
    const adminUid = await requireAdmin(request);

    const {applicationId, type, decision} =
      request.data as {
        applicationId: string;
        type: "dj" | "da";
        decision: "approved" | "rejected";
      };

    if (!applicationId || !type || !decision) {
      throw new HttpsError(
        "invalid-argument",
        "applicationId, type and decision required"
      );
    }

    const col = type === "dj" ?
      "dj_applications" :
      "da_applications";

    const appRef = admin.firestore()
      .doc(`${col}/${applicationId}`);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      throw new HttpsError(
        "not-found", "Application not found"
      );
    }

    const appData = appSnap.data()!;
    const now = new Date().toISOString();

    await appRef.update({
      status: decision,
      reviewedAt: now,
      reviewedBy: adminUid,
    });

    // If approved → upgrade user role to broadcaster
    if (decision === "approved" && appData.userId) {
      await admin.firestore()
        .doc(`users/${appData.userId}`)
        .update({role: "broadcaster"});
    }

    // Notify the applicant
    if (appData.userId) {
      await createNotification({
        userId: appData.userId,
        type: decision === "approved" ?
          "application_approved" :
          "application_rejected",
      });

      // Send decision email
      const userSnap = await admin.firestore()
        .doc(`users/${appData.userId}`).get();
      const userData = userSnap.data();
      if (userData?.email) {
        const displayName =
          appData.artistName ??
          userData.displayName ?? "DJ";
        const lang: string =
          userData.language ?? "fr";
        const en = lang.startsWith("en");

        const subject = decision === "approved" ?
          (en ?
            "Your SHUT application is approved!" :
            "Ta candidature SHUT est accept\u00e9e !") :
          (en ?
            "Update on your SHUT application" :
            "Mise \u00e0 jour de ta candidature SHUT");

        const resend = new Resend(
          resendApiKey.value()
        );
        try {
          await resend.emails.send({
            from:
              "SHUT <support@shutdiffusion.com>",
            to: [userData.email],
            subject,
            html: buildApplicationEmail(
              displayName, decision, lang
            ),
          });
        } catch (err) {
          console.error(
            "Failed to send decision email:", err
          );
        }
      }
    }

    return {success: true};
  }
);

// ── Reapply DJ application ────────────────────

/**
 * Allows a rejected DJ to submit a new application.
 * Rate limited to 2 per day per user.
 * @param {object} request Cloud Function request.
 * @return {object} Success status.
 */
export const reapplyDJ = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated", "Login required"
      );
    }
    const uid = request.auth.uid;

    const fdb = admin.firestore();

    // Check user has applicationRole dj
    const userSnap = await fdb
      .doc(`users/${uid}`).get();
    const userData = userSnap.data();
    if (userData?.applicationRole !== "dj") {
      throw new HttpsError(
        "permission-denied",
        "Only DJ applicants can reapply"
      );
    }

    // Check they have a rejected application
    const appsSnap = await fdb
      .collection("dj_applications")
      .where("userId", "==", uid)
      .where("status", "==", "rejected")
      .orderBy("submittedAt", "desc")
      .limit(1)
      .get();
    if (appsSnap.empty) {
      throw new HttpsError(
        "failed-precondition",
        "No rejected application found"
      );
    }

    // Rate limit: 2 per day
    const rateLimitRef = fdb
      .collection("_rateLimits")
      .doc(`reapply_${uid}`);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const rateLimitDoc = await rateLimitRef.get();
    const rlData = rateLimitDoc.data();

    if (rlData) {
      const recent = (rlData.timestamps || [])
        .filter((ts: number) => now - ts < oneDay);
      if (recent.length >= 2) {
        throw new HttpsError(
          "resource-exhausted",
          "Maximum 2 applications per day"
        );
      }
      await rateLimitRef.set({
        timestamps: [...recent, now],
      });
    } else {
      await rateLimitRef.set({
        timestamps: [now],
      });
    }

    // Use client-provided data, fallback to profile
    const input = request.data || {};
    const lastApp = appsSnap.docs[0].data();

    const bio = (typeof input.bio === "string" &&
      input.bio.trim()) ?
      input.bio.trim() :
      (userData?.bio ?? lastApp.bio ?? "");
    const genres = (Array.isArray(input.genres) &&
      input.genres.length > 0) ?
      input.genres :
      (userData?.genres ?? lastApp.genres ?? []);
    const experience = input.experience ??
      userData?.experience ?? lastApp.experience ?? null;
    const worksLinks = (Array.isArray(input.worksLinks) &&
      input.worksLinks.length > 0) ?
      input.worksLinks.filter(
        (l: string) => typeof l === "string" && l.trim()
      ) :
      (lastApp.worksLinks ?? []);

    await fdb.collection("dj_applications").add({
      userId: uid,
      artistName: userData?.artistName ??
        lastApp.artistName ?? "",
      bio,
      genres,
      experience,
      worksLinks,
      cityName: userData?.cityName ??
        lastApp.cityName ?? "",
      countryCode: userData?.countryCode ??
        lastApp.countryCode ?? "",
      cityId: userData?.cityId ??
        lastApp.cityId ?? "",
      status: "pending",
      submittedAt: new Date().toISOString(),
      reapply: true,
    });

    return {success: true};
  }
);

// ── Admin stats ───────────────────────────────

export const getAdminStats = onCall(
  async (request) => {
    await requireAdmin(request);

    const db = admin.firestore();

    const [
      usersSnap,
      broadcastersSnap,
      livesSnap,
      replaysSnap,
      djAppsSnap,
      daAppsSnap,
      reportsSnap,
    ] = await Promise.all([
      db.collection("users")
        .count().get(),
      db.collection("users")
        .where("role", "==", "broadcaster")
        .count().get(),
      db.collection("events")
        .where("status", "==", "live")
        .count().get(),
      db.collection("replays")
        .where("status", "==", "published")
        .count().get(),
      db.collection("dj_applications")
        .where("status", "==", "pending")
        .count().get(),
      db.collection("da_applications")
        .where("status", "==", "pending")
        .count().get(),
      db.collection("reports")
        .where("status", "==", "pending")
        .count().get(),
    ]);

    return {
      totalUsers: usersSnap.data().count,
      totalBroadcasters: broadcastersSnap.data().count,
      totalLivesActive: livesSnap.data().count,
      totalReplays: replaysSnap.data().count,
      pendingApplications:
        djAppsSnap.data().count +
        daAppsSnap.data().count,
      pendingReports: reportsSnap.data().count,
    };
  }
);

// ── Stats over time (for charts) ──────────────

export const getStatsTimeSeries = onCall(
  async (request) => {
    await requireAdmin(request);

    const {metric, period} = request.data as {
      metric: "users" | "events" | "replays";
      period: "day" | "week" | "month" | "year";
    };

    const db = admin.firestore();
    const now = new Date();
    let startDate: Date;
    let groupFn: (d: Date) => string;

    switch (period) {
    case "day":
      // Last 24h, grouped by hour
      startDate = new Date(
        now.getTime() - 24 * 60 * 60 * 1000
      );
      groupFn = (d) => `${d.getHours()}h`;
      break;
    case "week":
      // Last 7 days, grouped by day
      startDate = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      groupFn = (d) =>
        `${d.getDate()}/${d.getMonth() + 1}`;
      break;
    case "month":
      // Last 30 days, grouped by day
      startDate = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      groupFn = (d) =>
        `${d.getDate()}/${d.getMonth() + 1}`;
      break;
    case "year":
      // Last 12 months, grouped by month
      startDate = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        1
      );
      groupFn = (d) => {
        const m = [
          "Jan", "Feb", "Mar", "Apr",
          "May", "Jun", "Jul", "Aug",
          "Sep", "Oct", "Nov", "Dec",
        ];
        return m[d.getMonth()];
      };
      break;
    default:
      throw new HttpsError(
        "invalid-argument", "Invalid period"
      );
    }

    const isoStart = startDate.toISOString();
    let col: string;
    let dateField: string;

    switch (metric) {
    case "users":
      col = "users";
      dateField = "createdAt";
      break;
    case "events":
      col = "events";
      dateField = "createdAt";
      break;
    case "replays":
      col = "replays";
      dateField = "createdAt";
      break;
    default:
      throw new HttpsError(
        "invalid-argument", "Invalid metric"
      );
    }

    const snap = await db.collection(col)
      .where(dateField, ">=", isoStart)
      .orderBy(dateField, "asc")
      .get();

    const groups: Record<string, number> = {};
    snap.docs.forEach((d) => {
      const raw = d.data()[dateField];
      if (!raw) return;
      const date = typeof raw === "string" ?
        new Date(raw) :
        raw.toDate();
      const key = groupFn(date);
      groups[key] = (groups[key] || 0) + 1;
    });

    const dataPoints = Object.entries(groups)
      .map(([label, value]) => ({label, value}));

    return {dataPoints};
  }
);

// ── Review report ─────────────────────────────

export const reviewReport = onCall(
  async (request) => {
    const adminUid = await requireAdmin(request);

    const {reportId, action} = request.data as {
      reportId: string;
      action: "dismissed" | "warning" |
        "content_removed" | "user_banned";
    };

    if (!reportId || !action) {
      throw new HttpsError(
        "invalid-argument",
        "reportId and action required"
      );
    }

    const reportRef = admin.firestore()
      .doc(`reports/${reportId}`);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) {
      throw new HttpsError(
        "not-found", "Report not found"
      );
    }

    const status = action === "dismissed" ?
      "dismissed" : "reviewed";

    await reportRef.update({
      status,
      action: action === "dismissed" ?
        "none" : action,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminUid,
    });

    return {success: true};
  }
);

// ── Admin: change user role ───────────────────
export const adminSetUserRole = onCall(
  async (request) => {
    await requireAdmin(request);
    const {userId, role} = request.data as {
      userId: string; role: string;
    };
    const validRoles = [
      "viewer", "broadcaster", "admin",
    ];
    if (!userId || !validRoles.includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        "userId and valid role required"
      );
    }
    const userRef = admin.firestore()
      .doc(`users/${userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError(
        "not-found", "User not found"
      );
    }
    await userRef.update({role});
    return {success: true};
  }
);

// ── Admin: block / unblock user ───────────────
export const adminBlockUser = onCall(
  async (request) => {
    await requireAdmin(request);
    const {userId, blocked} = request.data as {
      userId: string; blocked: boolean;
    };
    if (!userId || typeof blocked !== "boolean") {
      throw new HttpsError(
        "invalid-argument",
        "userId and blocked flag required"
      );
    }
    const userRef = admin.firestore()
      .doc(`users/${userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError(
        "not-found", "User not found"
      );
    }
    await admin.auth().updateUser(
      userId, {disabled: blocked}
    );
    await userRef.update({
      blocked,
      blockedAt: blocked ?
        new Date().toISOString() : null,
    });
    return {success: true};
  }
);

// ── Mux Plus pricing (USD per minute) ────────
// Matches Mux "Plus" plan 720p tier
// Mux Plus 720p pricing (USD) – calibrated
const MUX_PRICES = {
  // Live Stream Ingest (Plus 720p input)
  liveInputPerMin: 0.055,
  // Storage Plus 720p (per min stored per month)
  storagePerMinMonth: 0.005,
  // 720p Delivery Usage (per min delivered)
  deliveryPerMin: 0.001,
};

// ── Admin: get API costs ─────────────────────
export const getApiCosts = onCall(
  {secrets: [muxTokenId, muxTokenSecret]},
  async (request) => {
    await requireAdmin(request);

    const mux = getMux();
    const fdb = admin.firestore();
    const now = new Date();
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    );
    // Helper: convert any date field to Date
    const toDate = (v: unknown): Date | null => {
      if (!v) return null;
      if (v instanceof Date) return v;
      if (typeof v === "object" && v !== null &&
          "toDate" in v &&
          typeof (v as {toDate: () => Date})
            .toDate === "function") {
        return (v as {toDate: () => Date}).toDate();
      }
      if (typeof v === "string") {
        return new Date(v);
      }
      return null;
    };

    // 1) Live input: real durations from our
    //    Firestore events (actualStart→actualEnd)
    const eventsSnap = await fdb
      .collection("events")
      .where("status", "==", "ended")
      .get();
    let totalLiveInputSec = 0;
    let liveEventsCount = 0;
    eventsSnap.docs.forEach((d) => {
      const data = d.data();
      const s = toDate(data.actualStartTime);
      const e = toDate(data.actualEndTime);
      if (!s || !e) return;
      // Only count events from last 30 days
      if (s < thirtyDaysAgo) return;
      const dur = (e.getTime() - s.getTime()) / 1000;
      if (dur > 0) {
        totalLiveInputSec += dur;
        liveEventsCount++;
      }
    });
    const totalLiveInputMin =
      totalLiveInputSec / 60;

    // 2) Delivery: real data from Mux API
    let totalDeliverySec = 0;
    try {
      const deliveryPage =
        await mux.video.deliveryUsage.list({
          timeframe: [
            String(Math.floor(
              thirtyDaysAgo.getTime() / 1000)),
            String(Math.floor(
              now.getTime() / 1000)),
          ],
        });
      // PageWithTotal has a .data array
      const items = deliveryPage?.data ?? [];
      for (const du of items) {
        totalDeliverySec +=
          du.delivered_seconds || 0;
      }
    } catch (err) {
      console.warn("deliveryUsage error:", err);
    }
    const totalDeliveryMin =
      totalDeliverySec / 60;

    // 3) Storage: total duration of all Mux assets
    let totalStorageSec = 0;
    let assetsCount = 0;
    const assets = await mux.video.assets.list(
      {limit: 200}
    );
    for await (const a of assets) {
      totalStorageSec += a.duration || 0;
      assetsCount++;
    }
    const totalStorageMin = totalStorageSec / 60;

    // 4) Count live streams
    let liveStreamsCount = 0;
    const streams = await mux.video.liveStreams
      .list({limit: 200});
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of streams) {
      liveStreamsCount++;
    }

    // Calculate costs in USD
    const liveInputCost =
      totalLiveInputMin *
      MUX_PRICES.liveInputPerMin;
    const storageCost =
      totalStorageMin *
      MUX_PRICES.storagePerMinMonth;
    const deliveryCost =
      totalDeliveryMin *
      MUX_PRICES.deliveryPerMin;
    const muxTotal =
      liveInputCost + storageCost + deliveryCost;

    // Firebase usage from Firestore
    const [
      usersCount, evtCount,
      replaysCount, reportsCount,
    ] = await Promise.all([
      fdb.collection("users").count().get(),
      fdb.collection("events").count().get(),
      fdb.collection("replays").count().get(),
      fdb.collection("reports").count().get(),
    ]);

    // Check last alert
    const alertDoc = await fdb
      .doc("_admin/muxCostAlert").get();
    const lastAlertDate = alertDoc.exists ?
      alertDoc.data()?.lastAlertDate : null;

    return {
      mux: {
        totalEstimatedCost: Math.round(
          muxTotal * 100) / 100,
        currency: "USD",
        breakdown: {
          liveInput: {
            minutes: Math.round(
              totalLiveInputMin),
            cost: Math.round(
              liveInputCost * 100) / 100,
          },
          storage: {
            minutes: Math.round(totalStorageMin),
            cost: Math.round(
              storageCost * 100) / 100,
          },
          delivery: {
            minutes: Math.round(
              totalDeliveryMin),
            cost: Math.round(
              deliveryCost * 100) / 100,
          },
        },
        assetsCount,
        liveStreamsCount,
        liveEventsCount,
      },
      firebase: {
        users: usersCount.data().count,
        events: evtCount.data().count,
        replays: replaysCount.data().count,
        reports: reportsCount.data().count,
      },
      alertThreshold: 300,
      lastAlertDate,
      period: "last30days",
      muxDashboardUrl:
        "https://dashboard.mux.com/organizations/7hsf5j/usage/reports",
    };
  }
);

// ── Notification helper ───────────────────────

/**
 * Create a notification doc and optionally send
 * a push via FCM.
 * @param {object} data Notification payload.
 */
async function createNotification(data: {
  userId: string;
  type: string;
  actorId?: string;
  actorName?: string;
  actorAvatarUrl?: string | null;
  targetId?: string;
  targetLabel?: string;
  message?: string;
}) {
  const fdb = admin.firestore();
  const notifDoc = {
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await fdb.collection("notifications").add(notifDoc);

  // Send push notification if user has a token
  const userSnap = await fdb
    .doc(`users/${data.userId}`).get();
  const token = userSnap.data()?.expoPushToken;
  if (token) {
    try {
      await admin.messaging().send({
        token,
        notification: {
          title: "SHUT",
          body: pushBody(data.type, data),
        },
        data: {
          type: data.type,
          targetId: data.targetId ?? "",
          targetLabel: data.targetLabel ?? "",
          actorId: data.actorId ?? "",
        },
      });
    } catch (err) {
      console.warn("Push send error:", err);
    }
  }
}

/**
 * Build push notification body text.
 * @param {string} type Notification type.
 * @param {object} data Actor and message data.
 * @return {string} Push body text.
 */
function pushBody(
  type: string,
  data: {actorName?: string; message?: string}
): string {
  switch (type) {
  case "new_follower":
    return `${data.actorName ?? "Someone"} started following you`;
  case "live_started":
    return `${data.actorName ?? "A DJ"} is live!`;
  case "application_approved":
    return "Your application has been approved!";
  case "application_rejected":
    return "Your application has been declined";
  case "admin_announcement":
    return data.message ?? "New announcement from SHUT";
  case "new_application":
    return data.message ?? "New DJ application received";
  default:
    return "You have a new notification";
  }
}

// ── Notification: new follower ────────────────

export const onNewFollower = onDocumentCreated(
  {document: "userFollows/{followId}"},
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const {followerId, followeeId} = data as {
      followerId: string;
      followeeId: string;
    };

    // Get follower info for the notification
    const followerSnap = await admin.firestore()
      .doc(`users/${followerId}`).get();
    const follower = followerSnap.data();

    await createNotification({
      userId: followeeId,
      type: "new_follower",
      actorId: followerId,
      actorName:
        follower?.artistName ??
        follower?.firstName ??
        follower?.displayName ?? "Someone",
      actorAvatarUrl: follower?.avatarUrl ?? null,
    });
  }
);

// ── Notification: live started ────────────────

export const onLiveStarted = onDocumentUpdated(
  {document: "events/{eventId}"},
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Only trigger when status changes TO "live"
    if (before.status === "live" ||
        after.status !== "live") return;

    const djUserId = after.userId;
    if (!djUserId) return;

    const fdb = admin.firestore();

    // Get DJ info
    const djSnap = await fdb
      .doc(`users/${djUserId}`).get();
    const dj = djSnap.data();
    const djName =
      dj?.artistName ?? dj?.displayName ?? "DJ";

    // Get followers who have notifications enabled
    const followsSnap = await fdb
      .collection("userFollows")
      .where("followeeId", "==", djUserId)
      .where("notificationsEnabled", "==", true)
      .get();

    const eventId = event.params.eventId;

    // Create notifications in parallel (batch)
    const promises = followsSnap.docs.map((d) => {
      const followerId = d.data().followerId;
      return createNotification({
        userId: followerId,
        type: "live_started",
        actorId: djUserId,
        actorName: djName,
        actorAvatarUrl: dj?.avatarUrl ?? null,
        targetId: eventId,
        targetLabel: after.title ?? "",
      });
    });
    await Promise.all(promises);
  }
);

// ── Admin: send announcement ──────────────────

export const sendAdminAnnouncement = onCall(
  async (request) => {
    await requireAdmin(request);

    const {message} = request.data as {
      message: string;
    };

    if (!message || typeof message !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "message is required"
      );
    }

    const fdb = admin.firestore();
    const usersSnap = await fdb
      .collection("users").get();

    const promises = usersSnap.docs.map((d) =>
      createNotification({
        userId: d.id,
        type: "admin_announcement",
        message,
      })
    );
    await Promise.all(promises);
    return {success: true, count: usersSnap.size};
  }
);

// ── Scheduled: daily Mux cost check ──────────
const ALERT_EMAIL = "selim.douib@shutdiffusion.com";
const COST_THRESHOLD = 300; // USD

export const checkMuxCostAlert = onSchedule(
  {
    schedule: "every day 09:00",
    timeZone: "Europe/Paris",
    secrets: [
      muxTokenId, muxTokenSecret, resendApiKey,
    ],
  },
  async () => {
    const mux = getMux();
    const now = new Date();
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    // Live input from Firestore events
    const fdb = admin.firestore();
    const toDate = (v: unknown): Date | null => {
      if (!v) return null;
      if (v instanceof Date) return v;
      if (typeof v === "object" && v !== null &&
          "toDate" in v &&
          typeof (v as {toDate: () => Date})
            .toDate === "function") {
        return (v as {toDate: () => Date}).toDate();
      }
      if (typeof v === "string") return new Date(v);
      return null;
    };
    const evtSnap = await fdb
      .collection("events")
      .where("status", "==", "ended").get();
    let totalLiveMin = 0;
    evtSnap.docs.forEach((d) => {
      const data = d.data();
      const s = toDate(data.actualStartTime);
      const e = toDate(data.actualEndTime);
      if (!s || !e || s < thirtyDaysAgo) return;
      const dur = (e.getTime() - s.getTime()) /
        60000;
      if (dur > 0) totalLiveMin += dur;
    });

    // Storage + delivery from Mux API
    let totalStorageMin = 0;
    let totalDeliveryMin = 0;
    const assets = await mux.video.assets.list(
      {limit: 200}
    );
    for await (const a of assets) {
      totalStorageMin += (a.duration || 0) / 60;
    }
    try {
      const delPage =
        await mux.video.deliveryUsage.list({
          timeframe: [
            String(Math.floor(
              thirtyDaysAgo.getTime() / 1000)),
            String(Math.floor(
              now.getTime() / 1000)),
          ],
        });
      for (const du of (delPage?.data ?? [])) {
        totalDeliveryMin +=
          (du.delivered_seconds || 0) / 60;
      }
    } catch (err) {
      console.warn("deliveryUsage error:", err);
    }

    const totalCost =
      totalLiveMin *
        MUX_PRICES.liveInputPerMin +
      totalStorageMin *
        MUX_PRICES.storagePerMinMonth +
      totalDeliveryMin *
        MUX_PRICES.deliveryPerMin;

    if (totalCost < COST_THRESHOLD) return;

    // Check if already alerted this month
    const alertRef = fdb.doc("_admin/muxCostAlert");
    const alertSnap = await alertRef.get();
    const month = `${now.getFullYear()}-${
      now.getMonth() + 1}`;
    if (alertSnap.exists &&
        alertSnap.data()?.lastMonth === month) {
      return; // Already alerted this month
    }

    // Send email via Resend
    const resend = new Resend(resendApiKey.value());
    const costRounded = Math.round(
      totalCost * 100) / 100;
    await resend.emails.send({
      from: "SHUT Alerts <alerts@shutdiffusion.com>",
      to: [ALERT_EMAIL],
      subject:
        `[SHUT] Alerte Mux: $${costRounded} USD`,
      html: `
        <h2>Alerte de couts Mux</h2>
        <p>Le cout estime de Mux sur les
        30 derniers jours a depasse le seuil
        de <strong>$${COST_THRESHOLD} USD</strong>.
        </p>
        <p>Cout estime actuel:
        <strong>$${costRounded} USD</strong></p>
        <ul>
          <li>Live input:
            ${Math.round(totalLiveMin)} min</li>
          <li>Storage:
            ${Math.round(totalStorageMin)} min</li>
          <li>Delivery:
            ${Math.round(totalDeliveryMin)}
            min</li>
        </ul>
        <p>Verifiez votre dashboard Mux pour
        plus de details.</p>
      `,
    });

    // Send push notification to admin users
    const admins = await fdb.collection("users")
      .where("role", "==", "admin").get();
    const tokens: string[] = [];
    admins.docs.forEach((d) => {
      const fcm = d.data().fcmToken;
      if (fcm) tokens.push(fcm);
    });
    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: "Alerte couts Mux",
          body:
            `Cout estime: $${costRounded} ` +
            `(seuil: $${COST_THRESHOLD})`,
        },
        data: {type: "cost_alert"},
      });
    }

    // Record alert
    await alertRef.set({
      lastAlertDate: now.toISOString(),
      lastMonth: month,
      cost: costRounded,
    });
  }
);

// ── Notify admins on new application ──────────

const CONTACT_EMAIL = "contact@shutdiffusion.com";

/**
 * Handle a new application: email contact@ and
 * send in-app notifications to all admins.
 * @param {object} appData Application document data.
 * @param {string} appType "dj" or "da".
 * @param {string} appId Firestore document ID.
 */
async function notifyAdminsNewApplication(
  appData: Record<string, any>,
  appType: string,
  appId?: string
) {
  const fdb = admin.firestore();
  const label = appType === "dj" ? "DJ" :
    "Directeur Artistique";
  const artistName = appData.artistName ??
    appData.venueName ?? "Inconnu";
  const isReapply = appData.reapply === true;

  // 1) Email to contact@
  const resend = new Resend(resendApiKey.value());
  const subject = isReapply ?
    `[SHUT] Nouvelle re-candidature ${label}` +
    ` : ${artistName}` :
    `[SHUT] Nouvelle candidature ${label}` +
    ` : ${artistName}`;

  const genres = (appData.genres ?? []).join(", ");
  const city = appData.cityName ?
    `${appData.cityName}` +
    `${appData.countryCode ?
      " (" + appData.countryCode + ")" : ""}` :
    "Non renseign\u00e9e";

  try {
    await resend.emails.send({
      from: "SHUT <support@shutdiffusion.com>",
      to: [CONTACT_EMAIL],
      subject,
      html: [
        "<div style=\"font-family:sans-serif;" +
        "max-width:520px;margin:0 auto;" +
        "padding:24px;\">",
        `<h2>${subject}</h2>`,
        `<p><strong>Nom :</strong> ${artistName}</p>`,
        appData.bio ?
          `<p><strong>Bio :</strong> ${appData.bio}</p>` : "",
        genres ?
          `<p><strong>Genres :</strong> ${genres}</p>` : "",
        `<p><strong>Ville :</strong> ${city}</p>`,
        appData.worksLinks?.length ?
          "<p><strong>Liens :</strong><br/>" +
          appData.worksLinks
            .map((l: string) =>
              `<a href="${l}">${l}</a>`)
            .join("<br/>") + "</p>" : "",
        isReapply ?
          "<p><em>Re-candidature</em></p>" : "",
        "<hr/>",
        "<p style=\"color:#888;font-size:12px;\">" +
        "Connecte-toi au dashboard admin SHUT" +
        " pour examiner cette candidature.</p>",
        "</div>",
      ].join("\n"),
    });
  } catch (err) {
    console.error(
      "Failed to send application email:", err
    );
  }

  // 2) In-app notification to all admin users
  const adminsSnap = await fdb
    .collection("users")
    .where("role", "==", "admin")
    .get();

  const notifMessage = isReapply ?
    `Re-candidature ${label} : ${artistName}` :
    `Nouvelle candidature ${label} : ${artistName}`;

  const promises = adminsSnap.docs.map((d) =>
    createNotification({
      userId: d.id,
      type: "new_application",
      message: notifMessage,
      targetId: appId,
      targetLabel: appType,
    })
  );
  await Promise.all(promises);
}

export const onNewDJApplication = onDocumentCreated(
  {
    document: "dj_applications/{appId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const appId = event.params.appId;
    await notifyAdminsNewApplication(data, "dj", appId);
  }
);

export const onNewDAApplication = onDocumentCreated(
  {
    document: "da_applications/{appId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const appId = event.params.appId;
    await notifyAdminsNewApplication(data, "da", appId);
  }
);
