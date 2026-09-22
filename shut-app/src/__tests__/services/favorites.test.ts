// src/__tests__/services/favorites.test.ts
import { MockFavoritesService } from '../../services/favorites/favorites.mock';

describe('MockFavoritesService', () => {
  let svc: MockFavoritesService;

  beforeEach(() => {
    svc = new MockFavoritesService();
  });

  it('démarre avec une liste vide', async () => {
    const favs = await svc.getFavorites('user-1');
    expect(favs).toEqual([]);
  });

  it('ajoute un favori', async () => {
    await svc.addFavorite('user-1', 'event-1');
    const favs = await svc.getFavorites('user-1');
    expect(favs).toContain('event-1');
  });

  it('supprime un favori', async () => {
    await svc.addFavorite('user-1', 'event-1');
    await svc.removeFavorite('user-1', 'event-1');
    const favs = await svc.getFavorites('user-1');
    expect(favs).not.toContain('event-1');
  });

  it('vérifie si un favori existe', async () => {
    await svc.addFavorite('user-1', 'event-1');
    expect(await svc.isFavorite('user-1', 'event-1')).toBe(true);
    expect(await svc.isFavorite('user-1', 'event-2')).toBe(false);
  });

  it('isole les favoris par utilisateur', async () => {
    await svc.addFavorite('user-1', 'event-1');
    expect(await svc.getFavorites('user-2')).toEqual([]);
  });

  it('n\'ajoute pas en double', async () => {
    await svc.addFavorite('user-1', 'event-1');
    await svc.addFavorite('user-1', 'event-1');
    const favs = await svc.getFavorites('user-1');
    expect(favs.filter(id => id === 'event-1')).toHaveLength(1);
  });
});
