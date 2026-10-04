import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import Mux from "@mux/mux-node";

admin.initializeApp();

const muxTokenId = defineSecret("MUX_TOKEN_ID");
const muxTokenSecret =
  defineSecret("MUX_TOKEN_SECRET");

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
