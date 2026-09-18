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

    const {eventId} = request.data;
    console.log("createLiveStream called for eventId:", eventId);
    console.log("MUX_TOKEN_ID length:", muxTokenId.value()?.length);

    const mux = getMux();

    let liveStream;
    try {
      liveStream = await mux.video.liveStreams.create({
        playback_policy: ["public"],
        new_asset_settings: {
          playback_policy: ["public"],
        },
        latency_mode: "low",
        reconnect_window: 60,
        max_continuous_duration: 43200,
      });
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

    await admin.firestore()
      .doc(`events/${eventId}`).update({
        muxLiveStreamId: liveStream.id,
        muxStreamKey: liveStream.stream_key,
        muxRtmpUrl: RTMP,
        playbackUrl,
      });

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
    const ts = admin.firestore
      .FieldValue.serverTimestamp();

    if (type === "video.live_stream.active") {
      await eventDoc.ref.update({
        status: "live",
        actualStartTime: ts,
      });
    } else if (type === "video.live_stream.idle") {
      await eventDoc.ref.update({
        status: "ended",
        actualEndTime: ts,
      });
    }
    res.status(200).send("OK");
  }
);
