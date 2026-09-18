/**
 * TDD — Tests écrits AVANT l'implémentation de src/screens/LivesScreen.tsx
 */

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { LivesScreen } from '../../screens/LivesScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: {} }),
}));

const MOCK_LIVES = [
  {
    id: 'live-1',
    djName: 'Luca R',
    city: 'Lausanne',
    venue: 'Les Docks',
    genre: 'Techno',
    viewerCount: 432,
    duration: '1h24',
    thumbnailUrl: null,
    status: 'live' as const,
  },
  {
    id: 'live-2',
    djName: 'Sophie V',
    city: 'Genève',
    venue: 'Black Box',
    genre: 'House',
    viewerCount: 287,
    duration: '58 min',
    thumbnailUrl: null,
    status: 'live' as const,
  },
  {
    id: 'live-3',
    djName: 'Maceo',
    city: 'Zurich',
    venue: 'Hive Club',
    genre: 'Techno',
    viewerCount: 612,
    duration: '1h12',
    thumbnailUrl: null,
    status: 'live' as const,
  },
  {
    id: 'live-4',
    djName: 'Elie S',
    city: 'Bruxelles',
    venue: 'Fuse',
    genre: 'Progressive',
    viewerCount: 521,
    duration: '1h03',
    thumbnailUrl: null,
    status: 'live' as const,
  },
];

jest.mock('../../services', () => ({
  eventsService: {
    getLiveEvents: jest.fn(() => Promise.resolve(MOCK_LIVES)),
  },
}));

describe('LivesScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ─── Contenu de base ──────────────────────────────────────────────────────

  it('affiche le titre LIVE', async () => {
    render(<LivesScreen />);
    await waitFor(() => expect(screen.getByTestId('live-screen-title')).toBeTruthy());
  });

  it('affiche le sous-titre', async () => {
    render(<LivesScreen />);
    await waitFor(() =>
      expect(screen.getByText(/Tous les DJ en live/)).toBeTruthy()
    );
  });

  // ─── Filtres genres ───────────────────────────────────────────────────────

  it('affiche les pills de genres musicaux', async () => {
    render(<LivesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Tous')).toBeTruthy();
      expect(screen.getByText('Techno')).toBeTruthy();
      expect(screen.getByText('House')).toBeTruthy();
      expect(screen.getByText('Progressive')).toBeTruthy();
      expect(screen.getByText('Minimal')).toBeTruthy();
    });
  });

  it('"Tous" est actif par défaut', async () => {
    render(<LivesScreen />);
    await waitFor(() => expect(screen.getByText('Tous')).toBeTruthy());
    const tousElement = screen.getByText('Tous');
    expect(tousElement).toBeTruthy();
  });

  // ─── Liste des lives ──────────────────────────────────────────────────────

  it('affiche tous les lives au chargement', async () => {
    render(<LivesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Luca R')).toBeTruthy();
      expect(screen.getByText('Sophie V')).toBeTruthy();
      expect(screen.getByText('Maceo')).toBeTruthy();
      expect(screen.getByText('Elie S')).toBeTruthy();
    });
  });

  it('affiche le badge LIVE pour chaque live', async () => {
    render(<LivesScreen />);
    await waitFor(() => {
      const liveBadges = screen.getAllByTestId('live-badge');
      expect(liveBadges.length).toBe(MOCK_LIVES.length);
    });
  });

  it('affiche la ville de chaque DJ', async () => {
    render(<LivesScreen />);
    await waitFor(() => {
      expect(screen.getByText(/Lausanne/)).toBeTruthy();
      expect(screen.getByText(/Genève/)).toBeTruthy();
    });
  });

  it('affiche le nombre de viewers', async () => {
    render(<LivesScreen />);
    await waitFor(() => {
      expect(screen.getByText(/432/)).toBeTruthy();
      expect(screen.getByText(/287/)).toBeTruthy();
    });
  });

  it('affiche la durée du live', async () => {
    render(<LivesScreen />);
    await waitFor(() => {
      expect(screen.getByText(/1h24/)).toBeTruthy();
    });
  });

  // ─── Filtrage par genre ───────────────────────────────────────────────────

  it('filtre les lives par genre Techno', async () => {
    render(<LivesScreen />);
    await waitFor(() => screen.getByText('Techno'));
    fireEvent.press(screen.getByText('Techno'));
    await waitFor(() => {
      expect(screen.getByText('Luca R')).toBeTruthy();
      expect(screen.getByText('Maceo')).toBeTruthy();
      expect(screen.queryByText('Sophie V')).toBeNull();
      expect(screen.queryByText('Elie S')).toBeNull();
    });
  });

  it('filtre les lives par genre House', async () => {
    render(<LivesScreen />);
    await waitFor(() => screen.getByText('House'));
    fireEvent.press(screen.getByText('House'));
    await waitFor(() => {
      expect(screen.getByText('Sophie V')).toBeTruthy();
      expect(screen.queryByText('Luca R')).toBeNull();
    });
  });

  it('revient à tous les lives après clic sur "Tous"', async () => {
    render(<LivesScreen />);
    await waitFor(() => screen.getByText('Techno'));
    fireEvent.press(screen.getByText('Techno'));
    fireEvent.press(screen.getByText('Tous'));
    await waitFor(() => {
      expect(screen.getByText('Luca R')).toBeTruthy();
      expect(screen.getByText('Sophie V')).toBeTruthy();
    });
  });

  // ─── Navigation ───────────────────────────────────────────────────────────

  it('navigue vers LivePlayer au clic sur un live', async () => {
    render(<LivesScreen />);
    await waitFor(() => screen.getByText('Luca R'));
    fireEvent.press(screen.getByText('Luca R'));
    expect(mockNavigate).toHaveBeenCalledWith('LivePlayer', { eventId: 'live-1' });
  });

  // ─── État vide ────────────────────────────────────────────────────────────

  it('affiche un message si aucun live n\'est disponible', async () => {
    const { eventsService } = require('../../services');
    eventsService.getLiveEvents.mockResolvedValueOnce([]);
    render(<LivesScreen />);
    await waitFor(() =>
      expect(screen.getByText(/Aucun live en cours/)).toBeTruthy()
    );
  });
});
