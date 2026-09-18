/**
 * TDD — Tests écrits AVANT l'implémentation de src/screens/SettingsScreen.tsx
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SettingsScreen } from '../../screens/SettingsScreen';

const mockSignOut = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-uid',
      displayName: 'Selim Douib',
      email: 'selim@shut.app',
      handle: 'selim.douib',
      photoURL: null,
    },
    isAuthenticated: true,
    signOut: mockSignOut,
  }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockNavigate.mockClear();
  });

  // ─── Titre ────────────────────────────────────────────────────────────────

  it('affiche le titre PARAMÈTRES', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('PARAMÈTRES')).toBeTruthy();
  });

  // ─── Profil utilisateur ───────────────────────────────────────────────────

  it('affiche le nom de l\'utilisateur', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Selim Douib')).toBeTruthy();
  });

  it('affiche le handle utilisateur', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('@selim.douib')).toBeTruthy();
  });

  // ─── Items de menu ────────────────────────────────────────────────────────

  it('affiche "Mon profil"', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Mon profil')).toBeTruthy();
  });

  it('affiche "Notifications"', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Notifications')).toBeTruthy();
  });

  it('affiche "Langue" avec la valeur courante', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Langue')).toBeTruthy();
    expect(screen.getByText('Français')).toBeTruthy();
  });

  it('affiche "Qualité vidéo" avec la valeur courante', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Qualité vidéo')).toBeTruthy();
    expect(screen.getByText('Auto')).toBeTruthy();
  });

  it('affiche "Confidentialité"', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Confidentialité')).toBeTruthy();
  });

  it('affiche "Aide & support"', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Aide & support')).toBeTruthy();
  });

  it('affiche "À propos de SHUT"', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('À propos de SHUT')).toBeTruthy();
  });

  // ─── Déconnexion ──────────────────────────────────────────────────────────

  it('affiche le bouton "Se déconnecter"', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Se déconnecter')).toBeTruthy();
  });

  it('appelle signOut au clic sur "Se déconnecter"', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Se déconnecter'));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  // ─── Navigation ───────────────────────────────────────────────────────────

  it('navigue vers la page profil au clic sur "Mon profil"', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Mon profil'));
    expect(mockNavigate).toHaveBeenCalledWith('Profile');
  });

  it('navigue vers la page profil au clic sur la card profil', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Selim Douib'));
    expect(mockNavigate).toHaveBeenCalledWith('Profile');
  });
});
