import { IReplaysService } from './replays.service';
import { Replay } from '../../types';

export class MockReplaysService implements IReplaysService {
  async getPublishedReplays(): Promise<Replay[]> { return []; }
  async getReplaysByUser(_userId: string): Promise<Replay[]> { return []; }
  async getPublishedReplaysByUser(_userId: string): Promise<Replay[]> { return []; }
  async getDraftReplaysByUser(_userId: string): Promise<Replay[]> { return []; }
  async getReplayById(_id: string): Promise<Replay | null> { return null; }
  async getReplayByEventId(_eventId: string): Promise<Replay | null> { return null; }
  onReplayChange(_id: string, _cb: (r: Replay | null) => void): () => void { return () => {}; }
  onReplayByEventId(_eventId: string, _cb: (r: Replay | null) => void): () => void { return () => {}; }
  async updateReplay(_id: string, _updates: Partial<Replay>): Promise<void> {}
}
