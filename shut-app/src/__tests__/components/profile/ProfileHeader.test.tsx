import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import type { User } from '../../../types/user';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

const baseUser: User = {
  id: 'user-dj-001',
  email: 'dj@example.com',
  username: 'djtest',
  displayName: 'DJ Test',
  artistName: 'DJ Test',
  role: 'broadcaster',
  festivalId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  followersCount: 120,
  followingCount: 30,
  experience: 'confirme',
  genres: ['Techno'],
  avatarUrl: null,
};

describe('ProfileHeader', () => {
  it('displays displayName', () => {
    render(<ProfileHeader user={baseUser} isOwnProfile={false} />);
    expect(screen.getByText('DJ Test')).toBeTruthy();
  });

  it('shows followers count', () => {
    render(<ProfileHeader user={baseUser} isOwnProfile={false} />);
    expect(screen.getByText('120')).toBeTruthy();
  });

  it('shows "Modifier le profil" button on own profile', () => {
    render(<ProfileHeader user={baseUser} isOwnProfile onEditPress={jest.fn()} />);
    expect(screen.getByText('Modifier le profil')).toBeTruthy();
  });

  it('does not show "Modifier le profil" on other profiles', () => {
    render(<ProfileHeader user={baseUser} isOwnProfile={false} />);
    expect(screen.queryByText('Modifier le profil')).toBeNull();
  });

  it('shows FollowButton on other profiles', () => {
    render(<ProfileHeader user={baseUser} isOwnProfile={false} isFollowing={false} onFollowPress={jest.fn()} />);
    expect(screen.getByTestId('follow-button')).toBeTruthy();
  });

  it('calls onEditPress when edit button pressed', () => {
    const onEditPress = jest.fn();
    render(<ProfileHeader user={baseUser} isOwnProfile onEditPress={onEditPress} />);
    fireEvent.press(screen.getByText('Modifier le profil'));
    expect(onEditPress).toHaveBeenCalledTimes(1);
  });

  it('shows ExperienceTag when experience is set', () => {
    render(<ProfileHeader user={baseUser} isOwnProfile={false} />);
    expect(screen.getByText('Confirmé')).toBeTruthy();
  });
});
