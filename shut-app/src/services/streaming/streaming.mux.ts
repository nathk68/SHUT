// ====================================================================
// MUX STREAMING SERVICE
// ====================================================================
// Architecture: Mobile App -> Firebase Cloud Functions -> Mux API
// The Mux API Secret never leaves the server. The app calls Cloud Functions.
//
// Cloud Functions code is in: /functions/src/mux.ts (see bottom of this file)
// ====================================================================

import { httpsCallable } from 'firebase/functions';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { functions, db } from '../../config/firebase.config';
import { IStreamingService, QuickStreamCredentials } from './streaming.service';
import { CameraConfig, StreamState } from '../../types';

export class MuxStreamingService implements IStreamingService {

  async getCamerasByFestival(festivalId: string): Promise<CameraConfig[]> {
    const q = query(collection(db, 'cameras'), where('festivalId', '==', festivalId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CameraConfig));
  }

  async addCamera(camera: Omit<CameraConfig, 'id' | 'createdAt'>): Promise<CameraConfig> {
    const data = { ...camera, createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, 'cameras'), data);
    return { id: docRef.id, ...data } as CameraConfig;
  }

  async removeCamera(cameraId: string): Promise<void> {
    await deleteDoc(doc(db, 'cameras', cameraId));
  }

  async regenerateStreamKey(cameraId: string): Promise<CameraConfig> {
    const fn = httpsCallable(functions, 'regenerateStreamKey');
    const result = await fn({ cameraId });
    return result.data as CameraConfig;
  }

  async getLiveStreamStatusById(muxLiveStreamId: string): Promise<{ status: string }> {
    const fn = httpsCallable(functions, 'getLiveStreamStatus');
    const result = await fn({ muxLiveStreamId });
    const data = result.data as any;
    return { status: data.status ?? 'idle' };
  }

  async getStreamState(cameraId: string): Promise<StreamState> {
    const fn = httpsCallable(functions, 'getLiveStreamStatus');
    const result = await fn({ cameraId });
    const data = result.data as any;
    return {
      isLive: data.status === 'active',
      playbackUrl: data.playbackUrl,
      viewerCount: data.viewerCount || 0,
      duration: data.duration || 0,
      health: data.status === 'active' ? 'excellent' : 'disconnected',
    };
  }

  async startStream(eventId: string, cameraId: string): Promise<StreamState> {
    const fn = httpsCallable(functions, 'createLiveStream');
    const result = await fn({ eventId, cameraId });
    const data = result.data as any;
    return {
      isLive: false,
      playbackUrl: data.playbackUrl,
      viewerCount: 0,
      duration: 0,
      health: 'disconnected',
    };
  }

  async stopStream(eventId: string): Promise<void> {
    const fn = httpsCallable(functions, 'endLiveStream');
    await fn({ eventId });
  }

  async startQuickStream(userId: string): Promise<QuickStreamCredentials> {
    // Reuse the existing createLiveStream Cloud Function.
    // Create a minimal event doc first so the CF can update it.
    // Doc must be in 'events' so the CF's .update() succeeds
    const eventRef = await addDoc(collection(db, 'events'), {
      userId,
      type: 'quick-stream',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    });
    const fn = httpsCallable(functions, 'createLiveStream');
    const result = await fn({ eventId: eventRef.id, cameraId: '' });
    const data = result.data as any;
    return {
      eventId: eventRef.id,
      rtmpUrl: data.rtmpUrl ?? 'rtmp://global-live.mux.com:5222/app',
      streamKey: data.streamKey,
    };
  }
}

// ====================================================================
// CLOUD FUNCTIONS CODE (to deploy separately)
// Copy this to: functions/src/mux.ts
// Install in functions/: npm install @mux/mux-node firebase-admin firebase-functions
// Deploy: firebase deploy --only functions
// ====================================================================
/*
import Mux from '@mux/mux-node';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const mux = new Mux({
  tokenId: functions.config().mux.token_id,
  tokenSecret: functions.config().mux.token_secret,
});

export const createLiveStream = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const userDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  if (userDoc.data()?.role !== 'broadcaster') {
    throw new functions.https.HttpsError('permission-denied', 'Broadcaster role required');
  }

  const { eventId } = data;

  const liveStream = await mux.video.liveStreams.create({
    playback_policy: ['public'],
    new_asset_settings: { playback_policy: ['public'] },
    latency_mode: 'low',
    reconnect_window: 60,
    max_continuous_duration: 43200,
  });

  await admin.firestore().doc(`events/${eventId}`).update({
    muxLiveStreamId: liveStream.id,
    muxStreamKey: liveStream.stream_key,
    rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
    playbackUrl: `https://stream.mux.com/${liveStream.playback_ids?.[0]?.id}.m3u8`,
  });

  return {
    streamKey: liveStream.stream_key,
    rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
    playbackId: liveStream.playback_ids?.[0]?.id,
    playbackUrl: `https://stream.mux.com/${liveStream.playback_ids?.[0]?.id}.m3u8`,
  };
});

export const getLiveStreamStatus = functions.https.onCall(async (data) => {
  const { muxLiveStreamId } = data;
  const stream = await mux.video.liveStreams.retrieve(muxLiveStreamId);
  return { status: stream.status, activeAssetId: stream.active_asset_id };
});

export const endLiveStream = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const { muxLiveStreamId, eventId } = data;
  await mux.video.liveStreams.disable(muxLiveStreamId);
  await admin.firestore().doc(`events/${eventId}`).update({
    status: 'ended',
    actualEndTime: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});

export const muxWebhook = functions.https.onRequest(async (req, res) => {
  const { type, data } = req.body;
  const streamId = data?.id;

  const eventsSnap = await admin.firestore()
    .collection('events')
    .where('muxLiveStreamId', '==', streamId)
    .limit(1)
    .get();

  if (eventsSnap.empty) { res.status(200).send('OK'); return; }

  const eventDoc = eventsSnap.docs[0];
  if (type === 'video.live_stream.active') {
    await eventDoc.ref.update({ status: 'live', actualStartTime: admin.firestore.FieldValue.serverTimestamp() });
  } else if (type === 'video.live_stream.idle') {
    await eventDoc.ref.update({ status: 'ended', actualEndTime: admin.firestore.FieldValue.serverTimestamp() });
  }
  res.status(200).send('OK');
});
*/
