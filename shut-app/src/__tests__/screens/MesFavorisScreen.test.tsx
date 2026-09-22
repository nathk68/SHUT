// src/__tests__/screens/MesFavorisScreen.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { MesFavorisScreen } from '../../screens/MesFavorisScreen';

jest.mock('../../contexts/FavoritesContext', () => ({
  useFavorites: jest.fn(() => ({
    favoriteIds: new Set(['event-1']),
    isLoading: false,
  })),
}));

jest.mock('../../services', () => ({
  eventsService: {
    getAllEvents: jest.fn().mockResolvedValue([
      {
        id: 'event-1',
        djName: 'DJ Shadow',
        status: 'ended',
        playbackUrl: 'https://stream.example.com/replay',
        genre: 'Techno',
        viewerCount: 42,
      },
    ]),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('MesFavorisScreen', () => {
  beforeEach(() => {
    const { useFavorites } = require('../../contexts/FavoritesContext');
    useFavorites.mockReturnValue({
      favoriteIds: new Set(['event-1']),
      isLoading: false,
    });
  });

  it('affiche le titre MES FAVORIS', async () => {
    render(<MesFavorisScreen />);
    await waitFor(() => expect(screen.getByText('MES FAVORIS')).toBeTruthy());
  });

  it('affiche la rediffusion dans les favoris', async () => {
    render(<MesFavorisScreen />);
    await waitFor(() => expect(screen.getByText('DJ Shadow')).toBeTruthy());
  });

  it('affiche l\'état vide quand aucun favori', async () => {
    const { useFavorites } = require('../../contexts/FavoritesContext');
    useFavorites.mockReturnValueOnce({ favoriteIds: new Set(), isLoading: false });
    // Stable fallback for all subsequent renders: keep the empty set
    useFavorites.mockReturnValue({ favoriteIds: new Set(), isLoading: false });
    render(<MesFavorisScreen />);
    expect(screen.getByText(/Aucun favori/)).toBeTruthy();
  });
});
