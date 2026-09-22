// src/__tests__/contexts/FavoritesContext.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { renderAsync, screen } from '@testing-library/react-native';
import { FavoritesProvider, useFavorites } from '../../contexts/FavoritesContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', displayName: 'Test User', avatarUrl: null },
    isAuthenticated: true,
    isGuest: false,
  }),
}));

jest.mock('../../services', () => ({
  favoritesService: {
    getFavorites: jest.fn().mockResolvedValue(['event-1', 'event-2']),
    addFavorite: jest.fn().mockResolvedValue(undefined),
    removeFavorite: jest.fn().mockResolvedValue(undefined),
  },
  likesService: {
    getLikes: jest.fn().mockResolvedValue(['event-3']),
    toggleLike: jest.fn().mockResolvedValue(true),
  },
}));

function TestConsumer() {
  const { isFavorite, isLiked, favoriteIds } = useFavorites();
  return (
    <>
      <Text testID="fav-count">{favoriteIds.size}</Text>
      <Text testID="is-fav-1">{String(isFavorite('event-1'))}</Text>
      <Text testID="is-liked-3">{String(isLiked('event-3'))}</Text>
    </>
  );
}

describe('FavoritesContext', () => {
  it('charge les favoris et likes de l\'utilisateur au mount', async () => {
    await renderAsync(
      <FavoritesProvider>
        <TestConsumer />
      </FavoritesProvider>
    );
    expect(screen.getByTestId('fav-count').props.children).toBe(2);
    expect(screen.getByTestId('is-fav-1').props.children).toBe('true');
    expect(screen.getByTestId('is-liked-3').props.children).toBe('true');
  });

  it('lance une erreur si useFavorites est utilisé hors du provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      // render synchronously without a provider — must throw
      const { render } = require('@testing-library/react-native');
      render(<TestConsumer />);
    }).toThrow();
    consoleError.mockRestore();
  });
});
