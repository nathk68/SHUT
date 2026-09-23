import type { UpdateProfilePayload, UserFollow } from '../../types/profile';
import type { User } from '../../types/user';

describe('Profile types', () => {
  it('UpdateProfilePayload accepts all profile fields', () => {
    const payload: UpdateProfilePayload = {
      username: 'djtest',
      artistName: 'DJ Test',
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: '1995-03-15',
      avatarUrl: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      musicGenres: ['Techno', 'House'],
      representedCityName: 'Lausanne',
      representedCountryCode: 'CH',
      experience: 'confirme',
      socialLinks: { instagram: 'djtest', soundcloud: 'djtest' },
    };
    expect(payload.username).toBe('djtest');
  });

  it('UserFollow has required fields', () => {
    const follow: UserFollow = {
      id: 'follow-1',
      followerId: 'user-1',
      followeeId: 'user-2',
      followedAt: '2026-09-23T00:00:00.000Z',
    };
    expect(follow.followerId).toBe('user-1');
  });

  it('User accepts new optional fields', () => {
    const user: User = {
      id: 'u1',
      email: 'a@b.com',
      username: 'tester',
      displayName: 'Tester',
      role: 'viewer',
      createdAt: '2026-09-23T00:00:00.000Z',
      followersCount: 10,
      followingCount: 5,
      bio: 'Hello',
      experience: 'intermediaire',
    };
    expect(user.followersCount).toBe(10);
  });
});
