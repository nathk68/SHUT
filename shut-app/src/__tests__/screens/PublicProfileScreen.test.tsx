import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { PublicProfileScreen } from '../../screens/PublicProfileScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { userId: 'user-dj-001' } }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('../../services/index', () => ({
  userService: {
    getUserById: jest.fn().mockResolvedValue({
      id: 'user-dj-001',
      email: 'luca@example.com',
      username: 'lucar',
      displayName: 'Luca R',
      artistName: 'Luca R',
      role: 'broadcaster',
      createdAt: '2026-01-01T00:00:00.000Z',
      followersCount: 142,
      followingCount: 38,
      experience: 'confirme',
      genres: ['Techno', 'Minimal'],
      bio: 'Techno DJ based in Lausanne',
      socialLinks: { instagram: 'lucar_dj' },
      festivalId: null,
      avatarUrl: null,
    }),
    updateProfile: jest.fn(),
    uploadAvatar: jest.fn(),
  },
  followService: {
    isFollowing: jest.fn().mockResolvedValue(false),
    follow: jest.fn().mockResolvedValue(undefined),
    unfollow: jest.fn().mockResolvedValue(undefined),
    getFollowing: jest.fn().mockResolvedValue([]),
    getFollowers: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-viewer-001',
      role: 'viewer',
      displayName: 'Alex Martin',
    },
  }),
}));

describe('PublicProfileScreen', () => {
  beforeEach(() => { mockNavigate.mockClear(); });

  it('affiche le nom du DJ', async () => {
    render(<PublicProfileScreen />);
    await waitFor(() => expect(screen.getByText('Luca R')).toBeTruthy());
  });

  it('affiche la bio', async () => {
    render(<PublicProfileScreen />);
    await waitFor(() => expect(screen.getByText('Techno DJ based in Lausanne')).toBeTruthy());
  });

  it('affiche le bouton Follow', async () => {
    render(<PublicProfileScreen />);
    await waitFor(() => expect(screen.getByTestId('follow-button')).toBeTruthy());
  });

  it('affiche le genre Techno', async () => {
    render(<PublicProfileScreen />);
    await waitFor(() => expect(screen.getByText('Techno')).toBeTruthy());
  });

  it('affiche le lien instagram', async () => {
    render(<PublicProfileScreen />);
    await waitFor(() => expect(screen.getByTestId('social-instagram')).toBeTruthy());
  });

  it('appelle followService.follow au clic sur Suivre', async () => {
    const { followService } = require('../../services/index');
    render(<PublicProfileScreen />);
    await waitFor(() => expect(screen.getByTestId('follow-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('follow-button'));
    await waitFor(() => expect(followService.follow).toHaveBeenCalledWith('user-viewer-001', 'user-dj-001'));
  });
});
