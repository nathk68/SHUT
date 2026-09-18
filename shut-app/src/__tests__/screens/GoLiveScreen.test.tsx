/**
 * TDD — Tests écrits AVANT l'implémentation de src/screens/GoLiveScreen.tsx
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { GoLiveScreen } from '../../screens/GoLiveScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// Mock du contexte rôle — sera surchargé dans certains tests
const mockUseRole = jest.fn(() => ({ currentRole: 'broadcaster' }));
jest.mock('../../contexts/RoleContext', () => ({
  useRole: () => mockUseRole(),
}));

const mockUseAuth = jest.fn(() => ({
  user: { uid: 'dj-test', displayName: 'DJ Test' },
  isAuthenticated: true,
}));
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('GoLiveScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseRole.mockReturnValue({ currentRole: 'broadcaster' });
    mockUseAuth.mockReturnValue({
      user: { uid: 'dj-test', displayName: 'DJ Test' },
      isAuthenticated: true,
    });
  });

  // ─── Contenu ──────────────────────────────────────────────────────────────

  it('affiche le titre DJ LIVE', () => {
    render(<GoLiveScreen />);
    expect(screen.getByText('DJ LIVE')).toBeTruthy();
  });

  it('affiche le sous-titre d\'invitation', () => {
    render(<GoLiveScreen />);
    expect(
      screen.getByText(/Lance ton live et partage ta musique avec le monde/)
    ).toBeTruthy();
  });

  it('affiche le bouton "Lancer mon live"', () => {
    render(<GoLiveScreen />);
    expect(screen.getByText('Lancer mon live')).toBeTruthy();
  });

  it('affiche la tagline inspirationnelle', () => {
    render(<GoLiveScreen />);
    expect(
      screen.getByText(/Partage ton univers\. Inspire\. Connecte\./)
    ).toBeTruthy();
  });

  // ─── Comportement DJ ──────────────────────────────────────────────────────

  it('navigue vers AudioCheck au clic sur "Lancer mon live" (compte DJ)', () => {
    render(<GoLiveScreen />);
    fireEvent.press(screen.getByText('Lancer mon live'));
    expect(mockNavigate).toHaveBeenCalledWith('AudioCheck');
  });

  // ─── Comportement non-DJ ──────────────────────────────────────────────────

  it('affiche un message pour les comptes non-DJ', () => {
    mockUseRole.mockReturnValue({ currentRole: 'viewer' });
    render(<GoLiveScreen />);
    expect(
      screen.getByText(/Cette fonctionnalité est réservée aux comptes DJ/)
    ).toBeTruthy();
  });

  it('ne navigue pas vers AudioCheck si l\'utilisateur n\'est pas DJ', () => {
    mockUseRole.mockReturnValue({ currentRole: 'viewer' });
    render(<GoLiveScreen />);
    const button = screen.queryByText('Lancer mon live');
    if (button) {
      fireEvent.press(button);
      expect(mockNavigate).not.toHaveBeenCalledWith('AudioCheck');
    }
  });

  // ─── Non authentifié ──────────────────────────────────────────────────────

  it('affiche un message de connexion si non authentifié', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    mockUseRole.mockReturnValue({ currentRole: 'viewer' });
    render(<GoLiveScreen />);
    expect(screen.getByText(/Connecte-toi|Cette fonctionnalité/)).toBeTruthy();
  });
});
