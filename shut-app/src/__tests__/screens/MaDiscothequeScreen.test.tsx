// src/__tests__/screens/MaDiscothequeScreen.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { MaDiscothequeScreen } from '../../screens/MaDiscothequeScreen';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-dj-1', displayName: 'DJ Shadow' },
    isAuthenticated: true,
  }),
}));

jest.mock('../../services', () => ({
  eventsService: {
    getAllEvents: jest.fn().mockResolvedValue([
      {
        id: 'event-1',
        djName: 'DJ Shadow',
        status: 'ended',
        playbackUrl: 'https://stream.example.com/replay',
        viewerCount: 150,
        scheduledStartTime: '2026-09-20T22:00:00Z',
      },
      {
        id: 'event-2',
        djName: 'DJ Autre',
        status: 'ended',
        playbackUrl: 'https://stream.example.com/replay2',
        viewerCount: 50,
        scheduledStartTime: '2026-09-19T22:00:00Z',
      },
    ]),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('MaDiscothequeScreen', () => {
  it('affiche le titre MA DISCOTHÈQUE', async () => {
    render(<MaDiscothequeScreen />);
    await waitFor(() => expect(screen.getByText('MA DISCOTHÈQUE')).toBeTruthy());
  });

  it('affiche seulement les sets du DJ connecté', async () => {
    render(<MaDiscothequeScreen />);
    await waitFor(() => expect(screen.getAllByText('DJ Shadow')).toBeTruthy());
    expect(screen.queryByText('DJ Autre')).toBeNull();
  });

  it('affiche l\'état vide si pas de rediffusions', async () => {
    const { eventsService } = require('../../services');
    eventsService.getAllEvents.mockResolvedValueOnce([]);
    render(<MaDiscothequeScreen />);
    await waitFor(() => expect(screen.getByText(/Aucune rediffusion/)).toBeTruthy());
  });
});
