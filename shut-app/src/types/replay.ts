export type ReplayStatus = 'processing' | 'draft' | 'published';

export interface Replay {
  id: string;
  userId: string;
  eventId: string;
  /** Mux Asset ID */
  muxAssetId: string;
  /** HLS playback URL for the recorded asset */
  playbackUrl: string;
  /** Thumbnail URL (from Mux) */
  thumbnailUrl: string | null;
  /** Duration in seconds */
  duration: number;
  /** DJ-editable fields */
  title: string;
  genres: string[];
  /** Trim points in seconds (client-side trim for playback) */
  trimStart: number;
  trimEnd: number;
  /** Location (free text, e.g. "Paris, France") */
  location: string | null;
  /** Date of the live session */
  liveDate: string | null;
  /** processing = Mux still encoding, draft = saved but not published, published = visible on profile */
  status: ReplayStatus;
  createdAt: string;
  publishedAt: string | null;
}
