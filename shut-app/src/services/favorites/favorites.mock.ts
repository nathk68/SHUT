import { IFavoritesService } from './favorites.service';

export class MockFavoritesService implements IFavoritesService {
  private store = new Map<string, Set<string>>();

  private getSet(userId: string): Set<string> {
    if (!this.store.has(userId)) this.store.set(userId, new Set());
    return this.store.get(userId)!;
  }

  async getFavorites(userId: string): Promise<string[]> {
    return Array.from(this.getSet(userId));
  }

  async addFavorite(userId: string, eventId: string): Promise<void> {
    this.getSet(userId).add(eventId);
  }

  async removeFavorite(userId: string, eventId: string): Promise<void> {
    this.getSet(userId).delete(eventId);
  }

  async isFavorite(userId: string, eventId: string): Promise<boolean> {
    return this.getSet(userId).has(eventId);
  }
}
