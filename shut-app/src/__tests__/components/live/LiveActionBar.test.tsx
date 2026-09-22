import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LiveActionBar } from '../../../components/live/LiveActionBar';

const mockToggleFavorite = jest.fn();
const mockToggleLike = jest.fn();

jest.mock('../../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    isLiked: () => false,
    toggleFavorite: mockToggleFavorite,
    toggleLike: mockToggleLike,
  }),
}));

const props = {
  eventId: 'event-1',
  djAvatarUrl: null,
  djName: 'DJ Shadow',
};

describe('LiveActionBar', () => {
  beforeEach(() => {
    mockToggleFavorite.mockClear();
    mockToggleLike.mockClear();
  });

  it('affiche l\'initiale du DJ quand pas d\'avatar', () => {
    render(<LiveActionBar {...props} />);
    expect(screen.getByText('D')).toBeTruthy();
  });

  it('appelle toggleLike au clic sur le coeur', () => {
    render(<LiveActionBar {...props} />);
    fireEvent.press(screen.getByTestId('action-like'));
    expect(mockToggleLike).toHaveBeenCalledWith('event-1');
  });

  it('appelle toggleFavorite au clic sur le bookmark', () => {
    render(<LiveActionBar {...props} />);
    fireEvent.press(screen.getByTestId('action-favorite'));
    expect(mockToggleFavorite).toHaveBeenCalledWith('event-1');
  });
});
