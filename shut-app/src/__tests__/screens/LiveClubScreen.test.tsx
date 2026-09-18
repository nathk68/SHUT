/**
 * TDD — Tests écrits AVANT l'implémentation de src/screens/LiveClubScreen.tsx
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LiveClubScreen } from '../../screens/LiveClubScreen';

describe('LiveClubScreen', () => {
  // ─── Contenu ──────────────────────────────────────────────────────────────

  it('affiche le titre LIVE CLUB', () => {
    render(<LiveClubScreen />);
    expect(screen.getByText('LIVE CLUB')).toBeTruthy();
  });

  it('affiche le badge "Bientôt disponible"', () => {
    render(<LiveClubScreen />);
    expect(screen.getByText('Bientôt disponible')).toBeTruthy();
  });

  it('affiche le message d\'accès prochainement', () => {
    render(<LiveClubScreen />);
    expect(screen.getByText(/Accès prochainement/)).toBeTruthy();
  });

  it('affiche le texte explicatif', () => {
    render(<LiveClubScreen />);
    expect(
      screen.getByText(/Le Live Club sera disponible dans une prochaine mise à jour/)
    ).toBeTruthy();
  });

  it('affiche l\'invitation à rester connecté', () => {
    render(<LiveClubScreen />);
    expect(screen.getByText(/reste connecté/i)).toBeTruthy();
  });

  // ─── Pas de navigation ────────────────────────────────────────────────────

  it('ne contient pas de bouton de navigation actif', () => {
    render(<LiveClubScreen />);
    // L'écran est purement informatif, pas de CTA de navigation
    expect(screen.queryByText('Explorer')).toBeNull();
    expect(screen.queryByText('Voir les lives')).toBeNull();
  });
});
