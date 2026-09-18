import * as Crypto from 'expo-crypto';
import { IStreamingService, QuickStreamCredentials } from './streaming.service';
import { CameraConfig, StreamState } from '../../types';
import { MOCK_FESTIVALS } from '../_mock-data/festivals';
import { getStoredData, setStoredData } from '../../utils/storage';

const CAMERAS_KEY = '@shut_cameras';

export class MockStreamingService implements IStreamingService {
  private async getCameras(): Promise<CameraConfig[]> {
    const stored = await getStoredData<CameraConfig[]>(CAMERAS_KEY);
    if (stored) return stored;
    const allCameras = MOCK_FESTIVALS.flatMap(f => f.cameras);
    await setStoredData(CAMERAS_KEY, allCameras);
    return allCameras;
  }

  private async saveCameras(cameras: CameraConfig[]): Promise<void> {
    await setStoredData(CAMERAS_KEY, cameras);
  }

  async getCamerasByFestival(festivalId: string): Promise<CameraConfig[]> {
    const all = await this.getCameras();
    return all.filter(c => c.festivalId === festivalId);
  }

  async addCamera(camera: Omit<CameraConfig, 'id' | 'createdAt'>): Promise<CameraConfig> {
    const all = await this.getCameras();
    const newCam: CameraConfig = {
      ...camera,
      id: `cam-${Crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    all.push(newCam);
    await this.saveCameras(all);
    return newCam;
  }

  async removeCamera(cameraId: string): Promise<void> {
    const all = await this.getCameras();
    await this.saveCameras(all.filter(c => c.id !== cameraId));
  }

  async regenerateStreamKey(cameraId: string): Promise<CameraConfig> {
    const all = await this.getCameras();
    const idx = all.findIndex(c => c.id === cameraId);
    if (idx === -1) throw new Error('Camera not found');
    all[idx] = { ...all[idx], streamKey: `sk_live_${Crypto.randomUUID().slice(0, 16)}` };
    await this.saveCameras(all);
    return all[idx];
  }

  async getLiveStreamStatusById(_muxLiveStreamId: string): Promise<{ status: string }> {
    return { status: 'active' };
  }

  async getStreamState(_cameraId: string): Promise<StreamState> {
    return {
      isLive: false,
      playbackUrl: null,
      viewerCount: 0,
      duration: 0,
      health: 'disconnected',
    };
  }

  async startStream(_eventId: string, _cameraId: string): Promise<StreamState> {
    return {
      isLive: true,
      playbackUrl: 'mock://live-stream',
      viewerCount: Math.floor(Math.random() * 200) + 50,
      duration: 0,
      health: 'excellent',
    };
  }

  async stopStream(_eventId: string): Promise<void> {
    // Mock: nothing to clean up
  }

  async startQuickStream(_userId: string): Promise<QuickStreamCredentials> {
    const key = `sk_live_${Crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
    return {
      eventId: `mock-quick-${Crypto.randomUUID().slice(0, 8)}`,
      rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
      streamKey: key,
    };
  }
}
