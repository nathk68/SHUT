export interface IFavoritesService {
  getFavorites(userId: string): Promise<string[]>;
  addFavorite(userId: string, eventId: string): Promise<void>;
  removeFavorite(userId: string, eventId: string): Promise<void>;
  isFavorite(userId: string, eventId: string): Promise<boolean>;
}
