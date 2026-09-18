import { CameraConfig, StreamState } from '../../types';

export interface QuickStreamCredentials {
  eventId: string;
  rtmpUrl: string;
  streamKey: string;
}

export interface IStreamingService {
  getCamerasByFestival(festivalId: string): Promise<CameraConfig[]>;
  addCamera(camera: Omit<CameraConfig, 'id' | 'createdAt'>): Promise<CameraConfig>;
  removeCamera(cameraId: string): Promise<void>;
  regenerateStreamKey(cameraId: string): Promise<CameraConfig>;
  getStreamState(cameraId: string): Promise<StreamState>;
  getLiveStreamStatusById(muxLiveStreamId: string): Promise<{ status: string }>;
  startStream(eventId: string, cameraId: string): Promise<StreamState>;
  stopStream(eventId: string): Promise<void>;
  // Ad-hoc stream (DJ tab — no pre-existing event required)
  startQuickStream(userId: string): Promise<QuickStreamCredentials>;
}
