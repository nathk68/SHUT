import { StreamHealth } from '../config/constants';

export interface CameraConfig {
  id: string;
  festivalId: string;
  label: string;
  rtmpUrl: string;
  streamKey: string;
  isLinkedHardware: boolean;
  hardwareSerial: string | null;
  createdAt: string;
}

export interface StreamState {
  isLive: boolean;
  playbackUrl: string | null;
  viewerCount: number;
  duration: number;
  health: StreamHealth;
}
