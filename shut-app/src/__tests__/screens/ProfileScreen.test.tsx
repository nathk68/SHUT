import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../../screens/ProfileScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
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
    },
    updateUser: jest.fn(),
  }),
}));

jest.mock('../../services/index', () => ({
  userService: { getUserById: jest.fn(), updateProfile: jest.fn(), uploadAvatar: jest.fn().mockResolvedValue('https://example.com/new-avatar.jpg') },
  followService: {},
  favoritesService: {},
  likesService: {},
}));

describe('ProfileScreen', () => {
  beforeEach(() => { mockNavigate.mockClear(); });

  it('affiche le nom de l\'artiste', async () => {
    render(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText('Luca R')).toBeTruthy());
  });

  it('affiche le bouton Modifier le profil', async () => {
    render(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText('Modifier le profil')).toBeTruthy());
  });

  it('affiche la bio', async () => {
    render(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText('Techno DJ based in Lausanne')).toBeTruthy());
  });

  it('affiche les genres musicaux', async () => {
    render(<ProfileScreen />);
    await waitFor(() => {
      expect(screen.getByText('Techno')).toBeTruthy();
      expect(screen.getByText('Minimal')).toBeTruthy();
    });
  });

  it('navigue vers EditProfile au clic sur Modifier', async () => {
    render(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText('Modifier le profil')).toBeTruthy());
    fireEvent.press(screen.getByText('Modifier le profil'));
    expect(mockNavigate).toHaveBeenCalledWith('EditProfile');
  });
});
