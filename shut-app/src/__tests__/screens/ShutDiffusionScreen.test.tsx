/**
 * TDD — Tests écrits AVANT l'implémentation de src/screens/ShutDiffusionScreen.tsx
 */

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ShutDiffusionScreen } from '../../screens/ShutDiffusionScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../services/_mock-data/countries', () => ({
  COUNTRIES: [
    { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
  ],
  CITIES: [
    { id: 'city-lausanne', name: 'Lausanne', countryCode: 'CH' },
    { id: 'city-geneve', name: 'Genève', countryCode: 'CH' },
    { id: 'city-paris', name: 'Paris', countryCode: 'FR' },
  ],
  DJ_PROFILES: [
    { id: 'dj-1', name: 'Luca R', cityId: 'city-lausanne', countryCode: 'CH', genre: 'Techno' },
    { id: 'dj-2', name: 'Sophie V', cityId: 'city-geneve', countryCode: 'CH', genre: 'House' },
    { id: 'dj-3', name: 'K-NT', cityId: 'city-paris', countryCode: 'FR', genre: 'Minimal' },
  ],
  VENUES: [
    { id: 'venue-docks', name: 'Les Docks', cityId: 'city-lausanne' },
    { id: 'venue-blackbox', name: 'Black Box', cityId: 'city-geneve' },
    { id: 'venue-machine', name: 'La Machine', cityId: 'city-paris' },
  ],
  getCitiesForCountry: (code: string) => {
    const map: Record<string, { id: string; name: string; countryCode: string }[]> = {
      CH: [
        { id: 'city-lausanne', name: 'Lausanne', countryCode: 'CH' },
        { id: 'city-geneve', name: 'Genève', countryCode: 'CH' },
      ],
      FR: [{ id: 'city-paris', name: 'Paris', countryCode: 'FR' }],
    };
    return map[code] ?? [];
  },
  getVenuesForCity: (id: string) => {
    const map: Record<string, { id: string; name: string; cityId: string }[]> = {
      'city-lausanne': [{ id: 'venue-docks', name: 'Les Docks', cityId: 'city-lausanne' }],
      'city-geneve': [{ id: 'venue-blackbox', name: 'Black Box', cityId: 'city-geneve' }],
      'city-paris': [{ id: 'venue-machine', name: 'La Machine', cityId: 'city-paris' }],
    };
    return map[id] ?? [];
  },
  getDJsForCity: (id: string) => {
    const map: Record<string, { id: string; name: string; cityId: string; countryCode: string; genre: string }[]> = {
      'city-lausanne': [{ id: 'dj-1', name: 'Luca R', cityId: 'city-lausanne', countryCode: 'CH', genre: 'Techno' }],
      'city-geneve': [{ id: 'dj-2', name: 'Sophie V', cityId: 'city-geneve', countryCode: 'CH', genre: 'House' }],
      'city-paris': [{ id: 'dj-3', name: 'K-NT', cityId: 'city-paris', countryCode: 'FR', genre: 'Minimal' }],
    };
    return map[id] ?? [];
  },
  searchDJs: (query: string) => {
    const djs = [
      { id: 'dj-1', name: 'Luca R', cityId: 'city-lausanne', countryCode: 'CH', genre: 'Techno' },
      { id: 'dj-2', name: 'Sophie V', cityId: 'city-geneve', countryCode: 'CH', genre: 'House' },
      { id: 'dj-3', name: 'K-NT', cityId: 'city-paris', countryCode: 'FR', genre: 'Minimal' },
    ];
    if (!query) return djs;
    return djs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  },
}));

describe('ShutDiffusionScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ─── Contenu de base ──────────────────────────────────────────────────────

  it('affiche le titre SHUT DIFFUSION', () => {
    render(<ShutDiffusionScreen />);
    expect(screen.getByText('SHUT DIFFUSION')).toBeTruthy();
  });

  it('affiche le sous-titre', () => {
    render(<ShutDiffusionScreen />);
    expect(
      screen.getByText(/Découvrez les pays partenaires et leurs scènes live/)
    ).toBeTruthy();
  });

  it('affiche le sélecteur de pays', () => {
    render(<ShutDiffusionScreen />);
    expect(screen.getByText('Choisir un pays')).toBeTruthy();
  });

  it('affiche le sélecteur de ville', () => {
    render(<ShutDiffusionScreen />);
    expect(screen.getByText('Choisir une ville')).toBeTruthy();
  });

  it('affiche le sélecteur de DJ', () => {
    render(<ShutDiffusionScreen />);
    expect(screen.getByText(/Choisir un DJ|Tous les DJs/)).toBeTruthy();
  });

  it('affiche le bouton "Voir les lives"', () => {
    render(<ShutDiffusionScreen />);
    expect(screen.getByText('Voir les lives')).toBeTruthy();
  });

  // ─── Sélection pays ───────────────────────────────────────────────────────

  it('affiche les pays disponibles quand on ouvre le sélecteur', () => {
    render(<ShutDiffusionScreen />);
    fireEvent.press(screen.getByText('Choisir un pays'));
    expect(screen.getByText('Suisse')).toBeTruthy();
    expect(screen.getByText('France')).toBeTruthy();
  });

  it('met à jour le sélecteur de pays après sélection', () => {
    render(<ShutDiffusionScreen />);
    fireEvent.press(screen.getByText('Choisir un pays'));
    fireEvent.press(screen.getByText('Suisse'));
    expect(screen.getByText('Suisse')).toBeTruthy();
  });

  // ─── Cascade pays → ville ─────────────────────────────────────────────────

  it('filtre les villes selon le pays sélectionné', async () => {
    render(<ShutDiffusionScreen />);
    fireEvent.press(screen.getByText('Choisir un pays'));
    fireEvent.press(screen.getByText('Suisse'));
    fireEvent.press(screen.getByText('Choisir une ville'));
    await waitFor(() => {
      expect(screen.getByText('Lausanne')).toBeTruthy();
      expect(screen.getByText('Genève')).toBeTruthy();
    });
    expect(screen.queryByText('Paris')).toBeNull();
  });

  it('remet la ville à zéro quand le pays change', async () => {
    render(<ShutDiffusionScreen />);
    // Sélectionner Suisse → Lausanne
    fireEvent.press(screen.getByText('Choisir un pays'));
    fireEvent.press(screen.getByText('Suisse'));
    fireEvent.press(screen.getByText('Choisir une ville'));
    fireEvent.press(screen.getByText('Lausanne'));
    // Changer pour France
    fireEvent.press(screen.getByText('Suisse'));
    fireEvent.press(screen.getByText('France'));
    await waitFor(() => {
      expect(screen.getByText('Choisir une ville')).toBeTruthy();
    });
  });

  // ─── Bouton Voir les lives ────────────────────────────────────────────────

  it('navigue vers l\'onglet Live au clic sur "Voir les lives"', () => {
    render(<ShutDiffusionScreen />);
    fireEvent.press(screen.getByText('Voir les lives'));
    expect(mockNavigate).toHaveBeenCalledWith('Live');
  });

  it('navigue vers Live avec les filtres actifs si un pays est sélectionné', () => {
    render(<ShutDiffusionScreen />);
    fireEvent.press(screen.getByText('Choisir un pays'));
    fireEvent.press(screen.getByText('Suisse'));
    fireEvent.press(screen.getByText('Voir les lives'));
    expect(mockNavigate).toHaveBeenCalledWith('Live', expect.objectContaining({ countryCode: 'CH' }));
  });
});
