import { User } from '../../types';

export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: 'user-broadcaster-001',
    email: 'festival@shut.app',
    password: 'demo123',
    displayName: 'Nuit Sonore',
    avatarUrl: null,
    role: 'broadcaster',
    festivalId: 'fest-001',
    createdAt: '2024-11-01T10:00:00Z',
  },
  {
    id: 'user-viewer-001',
    email: 'viewer@shut.app',
    password: 'demo123',
    displayName: 'Alex Martin',
    avatarUrl: null,
    role: 'viewer',
    festivalId: null,
    createdAt: '2025-01-15T14:00:00Z',
  },
  {
    id: 'user-dj-001',
    email: 'luca@example.com',
    password: 'demo123',
    username: 'lucar',
    displayName: 'Luca R',
    artistName: 'Luca R',
    avatarUrl: null,
    role: 'broadcaster' as const,
    festivalId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    genres: ['Techno', 'Minimal'],
    representedCityName: 'Lausanne',
    representedCountryCode: 'CH',
    experience: 'confirme' as const,
    bio: 'Techno DJ based in Lausanne',
    followersCount: 142,
    followingCount: 38,
    socialLinks: { instagram: 'lucar_dj', soundcloud: 'lucar' },
  },
];

// Chat mock users
export const MOCK_CHAT_USERS = [
  { id: 'chat-u1', name: 'TechnoFan92' },
  { id: 'chat-u2', name: 'BassDrop' },
  { id: 'chat-u3', name: 'NightOwl' },
  { id: 'chat-u4', name: 'DeepVibes' },
  { id: 'chat-u5', name: 'SynthWave' },
  { id: 'chat-u6', name: 'RaveMaster' },
  { id: 'chat-u7', name: 'BeatJunkie' },
  { id: 'chat-u8', name: 'VinylHead' },
];
