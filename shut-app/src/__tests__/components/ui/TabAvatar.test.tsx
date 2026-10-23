import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TabAvatar } from '../../../components/ui/TabAvatar';

const base = {
  size: 24,
  color: '#ffffff',
  avatarUrl: null,
  displayName: 'Nicolas',
  focused: false,
  isGuest: false,
};

describe('TabAvatar', () => {
  it('affiche la première lettre du nom quand pas d\'avatar', () => {
    render(<TabAvatar {...base} />);
    expect(screen.getByText('N')).toBeTruthy();
  });

  it('n\'affiche pas l\'initiale pour un guest', () => {
    render(<TabAvatar {...base} isGuest />);
    expect(screen.queryByText('N')).toBeNull();
  });

  it('n\'affiche pas l\'initiale quand avatarUrl est fourni', () => {
    render(<TabAvatar {...base} avatarUrl="https://example.com/pic.jpg" />);
    expect(screen.queryByText('N')).toBeNull();
  });

  it('gère un displayName vide sans crash', () => {
    render(<TabAvatar {...base} displayName="" />);
    expect(screen.getByText('?')).toBeTruthy();
  });
});
