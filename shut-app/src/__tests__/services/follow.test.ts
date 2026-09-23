import { MockFollowService } from '../../services/follow/follow.mock';

describe('MockFollowService', () => {
  let service: MockFollowService;

  beforeEach(() => {
    service = new MockFollowService();
  });

  it('isFollowing returns false before follow', async () => {
    const result = await service.isFollowing('user-a', 'user-b');
    expect(result).toBe(false);
  });

  it('follow makes isFollowing return true', async () => {
    await service.follow('user-a', 'user-b');
    const result = await service.isFollowing('user-a', 'user-b');
    expect(result).toBe(true);
  });

  it('unfollow makes isFollowing return false', async () => {
    await service.follow('user-a', 'user-b');
    await service.unfollow('user-a', 'user-b');
    const result = await service.isFollowing('user-a', 'user-b');
    expect(result).toBe(false);
  });

  it('getFollowing returns list of followee IDs', async () => {
    await service.follow('user-a', 'user-b');
    await service.follow('user-a', 'user-c');
    const following = await service.getFollowing('user-a');
    expect(following).toContain('user-b');
    expect(following).toContain('user-c');
  });

  it('getFollowers returns list of follower IDs', async () => {
    await service.follow('user-a', 'user-b');
    await service.follow('user-c', 'user-b');
    const followers = await service.getFollowers('user-b');
    expect(followers).toContain('user-a');
    expect(followers).toContain('user-c');
  });

  it('follow is idempotent', async () => {
    await service.follow('user-a', 'user-b');
    await service.follow('user-a', 'user-b');
    const following = await service.getFollowing('user-a');
    expect(following.filter((id) => id === 'user-b').length).toBe(1);
  });
});
