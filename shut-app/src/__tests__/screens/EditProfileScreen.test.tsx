import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { EditProfileScreen } from '../../screens/EditProfileScreen';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockUpdateUser = jest.fn().mockResolvedValue(undefined);
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: {
        id: 'user-dj-001',
        email: 'luca@example.com',
        username: 'lucar',
        displayName: 'Luca R',
        artistName: 'Luca R',
        role: 'broadcaster',
        createdAt: '2026-01-01T00:00:00.000Z',
        musicGenres: ['Techno'],
        bio: 'My bio',
        experience: 'confirme',
      },
    },
    updateUser: mockUpdateUser,
  }),
}));

jest.mock('../../services/index', () => ({
  userService: {
    uploadAvatar: jest.fn().mockResolvedValue('https://example.com/avatar.jpg'),
  },
}));

describe('EditProfileScreen', () => {
  beforeEach(() => { mockGoBack.mockClear(); mockUpdateUser.mockClear(); });

  it('affiche le champ Bio pré-rempli', async () => {
    render(<EditProfileScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('My bio')).toBeTruthy());
  });

  it('affiche le champ artistName pré-rempli', async () => {
    render(<EditProfileScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Luca R')).toBeTruthy());
  });

  it('affiche le bouton Enregistrer', () => {
    render(<EditProfileScreen />);
    expect(screen.getByText('Enregistrer')).toBeTruthy();
  });

  it('appelle updateUser au clic sur Enregistrer', async () => {
    render(<EditProfileScreen />);
    fireEvent.press(screen.getByText('Enregistrer'));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalled());
  });

  it('navigue en arrière après sauvegarde réussie', async () => {
    render(<EditProfileScreen />);
    fireEvent.press(screen.getByText('Enregistrer'));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
  });
});
