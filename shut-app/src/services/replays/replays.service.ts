import { Replay, ReplayStatus } from '../../types';

export interface IReplaysService {
  /** Get all published replays (global feed) */
  getPublishedReplays(): Promise<Replay[]>;
  /** Get all replays for a user (all statuses) */
  getReplaysByUser(userId: string): Promise<Replay[]>;
  /** Get only published replays for a user (visible on profile) */
  getPublishedReplaysByUser(userId: string): Promise<Replay[]>;
  /** Get drafts + processing replays for the current user's library */
  getDraftReplaysByUser(userId: string): Promise<Replay[]>;
  /** Get a single replay by ID */
  getReplayById(id: string): Promise<Replay | null>;
  /** Get replay by eventId (used after a live ends) */
  getReplayByEventId(eventId: string): Promise<Replay | null>;
  /** Real-time listener for a replay (used to wait for processing -> draft) */
  onReplayChange(id: string, callback: (replay: Replay | null) => void): () => void;
  /** Real-time listener for replay by eventId */
  onReplayByEventId(eventId: string, callback: (replay: Replay | null) => void): () => void;
  /** Update replay metadata (title, genres, status, trim) */
  updateReplay(id: string, updates: Partial<Pick<Replay, 'title' | 'genres' | 'status' | 'publishedAt' | 'trimStart' | 'trimEnd' | 'location' | 'liveDate' | 'duration'>>): Promise<void>;
}
