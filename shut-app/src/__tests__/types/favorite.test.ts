import { UserFavorite, UserLike } from '../../types/favorite';

describe('UserFavorite type', () => {
  it('satisfies the expected shape', () => {
    const fav: UserFavorite = {
      id: 'fav-1',
      userId: 'user-1',
      eventId: 'event-1',
      addedAt: new Date().toISOString(),
    };
    expect(fav.userId).toBe('user-1');
    expect(fav.eventId).toBe('event-1');
  });
});

describe('UserLike type', () => {
  it('satisfies the expected shape', () => {
    const like: UserLike = {
      id: 'like-1',
      userId: 'user-1',
      eventId: 'event-1',
      likedAt: new Date().toISOString(),
    };
    expect(like.userId).toBe('user-1');
  });
});
