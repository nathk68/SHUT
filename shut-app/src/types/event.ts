import { EventStatus } from '../config/constants';

export interface LiveEvent {
  id: string;
  festivalId: string;
  festivalName: string;
  festivalLogoUrl: string | null;
  title: string;
  description: string;
  djName: string;
  coverImageUrl: string | null;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  status: EventStatus;
  cameraId: string;
  playbackUrl: string | null;
  viewerCount: number;
  createdAt: string;
  // SHUT V1 — DJ discovery fields
  genre?: string;
  city?: string;
  venue?: string;
  duration?: string;
  thumbnailUrl?: string | null;
  // Mux live stream credentials (set when stream is prepared)
  muxLiveStreamId?: string | null;
  muxStreamKey?: string | null;
  muxRtmpUrl?: string | null;
}
