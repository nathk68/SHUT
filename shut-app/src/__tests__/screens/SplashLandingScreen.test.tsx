/**
 * TDD — Tests écrits AVANT l'implémentation de src/screens/SplashLandingScreen.tsx
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SplashLandingScreen } from '../../screens/SplashLandingScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('SplashLandingScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ─── Contenu ──────────────────────────────────────────────────────────────

  it('affiche le titre principal', () => {
    render(<SplashLandingScreen />);
    expect(screen.getByText('LA PLANÈTE DES DJ')).toBeTruthy();
  });

  it('affiche "EN LIVE" dans le titre', () => {
    render(<SplashLandingScreen />);
    expect(screen.getByText('EN LIVE')).toBeTruthy();
  });

  it('affiche la tagline', () => {
    render(<SplashLandingScreen />);
    expect(screen.getByText(/Des DJ\. Des villes\. Des cultures\./)).toBeTruthy();
  });

  it('affiche le bouton Explorer', () => {
    render(<SplashLandingScreen />);
    expect(screen.getByText('Explorer')).toBeTruthy();
  });

  it('affiche le logo SHUT', () => {
    render(<SplashLandingScreen />);
    expect(screen.getByText('SHUT')).toBeTruthy();
  });

  // ─── Navigation ───────────────────────────────────────────────────────────

  it('navigue vers Login au clic sur Explorer', () => {
    render(<SplashLandingScreen />);
    fireEvent.press(screen.getByText('Explorer'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('n\'appelle navigate qu\'une seule fois par clic', () => {
    render(<SplashLandingScreen />);
    fireEvent.press(screen.getByText('Explorer'));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
