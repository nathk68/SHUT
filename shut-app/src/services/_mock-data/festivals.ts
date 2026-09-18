import { Festival } from '../../types';

export const MOCK_FESTIVALS: Festival[] = [
  {
    id: 'fest-001',
    name: 'Nuit Sonore',
    description: 'Festival de musique électronique à Lyon',
    logoUrl: null,
    coverImageUrl: null,
    location: 'Lyon, France',
    ownerId: 'user-broadcaster-001',
    cameras: [
      {
        id: 'cam-001',
        festivalId: 'fest-001',
        label: 'Main Stage',
        rtmpUrl: 'rtmp://live.shut.app/live',
        streamKey: 'sk_live_nuitsonore_main_a1b2c3d4',
        isLinkedHardware: true,
        hardwareSerial: 'SHUT-2025-0042',
        createdAt: '2025-01-15T10:00:00Z',
      },
      {
        id: 'cam-002',
        festivalId: 'fest-001',
        label: 'DJ Booth Close-Up',
        rtmpUrl: 'rtmp://live.shut.app/live',
        streamKey: 'sk_live_nuitsonore_booth_e5f6g7h8',
        isLinkedHardware: false,
        hardwareSerial: null,
        createdAt: '2025-02-01T10:00:00Z',
      },
    ],
    createdAt: '2024-11-01T10:00:00Z',
  },
  {
    id: 'fest-002',
    name: 'Warehouse Project',
    description: 'Underground electronic music events',
    logoUrl: null,
    coverImageUrl: null,
    location: 'Manchester, UK',
    ownerId: 'user-broadcaster-002',
    cameras: [
      {
        id: 'cam-003',
        festivalId: 'fest-002',
        label: 'Main Room',
        rtmpUrl: 'rtmp://live.shut.app/live',
        streamKey: 'sk_live_warehouse_main_i9j0k1l2',
        isLinkedHardware: true,
        hardwareSerial: 'SHUT-2025-0078',
        createdAt: '2025-01-20T10:00:00Z',
      },
    ],
    createdAt: '2024-12-01T10:00:00Z',
  },
];
