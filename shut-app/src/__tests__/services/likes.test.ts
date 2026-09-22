// src/__tests__/services/likes.test.ts
import { MockLikesService } from '../../services/likes/likes.mock';

describe('MockLikesService', () => {
  let svc: MockLikesService;

  beforeEach(() => {
    svc = new MockLikesService();
  });

  it('démarre sans likes', async () => {
    expect(await svc.getLikes('user-1')).toEqual([]);
  });

  it('like un event (toggleLike retourne true)', async () => {
    const result = await svc.toggleLike('user-1', 'event-1');
    expect(result).toBe(true);
    expect(await svc.isLiked('user-1', 'event-1')).toBe(true);
  });

  it('unlike un event déjà liké (toggleLike retourne false)', async () => {
    await svc.toggleLike('user-1', 'event-1');
    const result = await svc.toggleLike('user-1', 'event-1');
    expect(result).toBe(false);
    expect(await svc.isLiked('user-1', 'event-1')).toBe(false);
  });

  it('getLikes retourne les eventIds likés', async () => {
    await svc.toggleLike('user-1', 'event-1');
    await svc.toggleLike('user-1', 'event-2');
    const likes = await svc.getLikes('user-1');
    expect(likes).toContain('event-1');
    expect(likes).toContain('event-2');
  });

  it('isole les likes par utilisateur', async () => {
    await svc.toggleLike('user-1', 'event-1');
    expect(await svc.isLiked('user-2', 'event-1')).toBe(false);
  });
});
