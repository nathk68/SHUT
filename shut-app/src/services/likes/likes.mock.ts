import { ILikesService } from './likes.service';

export class MockLikesService implements ILikesService {
  private store = new Map<string, Set<string>>();

  private getSet(userId: string): Set<string> {
    if (!this.store.has(userId)) this.store.set(userId, new Set());
    return this.store.get(userId)!;
  }

  async getLikes(userId: string): Promise<string[]> {
    return Array.from(this.getSet(userId));
  }

  async toggleLike(userId: string, eventId: string): Promise<boolean> {
    const set = this.getSet(userId);
    if (set.has(eventId)) {
      set.delete(eventId);
      return false;
    }
    set.add(eventId);
    return true;
  }

  async isLiked(userId: string, eventId: string): Promise<boolean> {
    return this.getSet(userId).has(eventId);
  }

  async getLikesCountForItems(_itemIds: string[]): Promise<number> {
    return 0;
  }
}
