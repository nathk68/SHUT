// Toggle this single flag to switch from mock to real services
export const USE_MOCK = false;

export type UserRole = 'viewer' | 'broadcaster' | 'dj' | 'artistic_director';

export const MUSIC_GENRES = [
  'Acid House', 'Acid Techno', 'Afro House', 'Afro Tech', 'Ambient',
  'Bass House', 'Breakbeat / Breaks', 'Deep House', 'Disco / Nu-Disco', 'Downtempo',
  'Drum & Bass', 'Dub Techno', 'Dubstep', 'Electro', 'Electro House',
  'Electronica', 'French Touch', 'Funky House', 'Garage / UK Garage', 'Hard Dance',
  'Hard House', 'Hard Techno', 'Hardcore', 'Hardstyle', 'House',
  'Industrial Techno', 'Jungle', 'Latin House', 'Melodic House', 'Melodic Techno',
  'Minimal', 'Minimal Techno', 'Organic House', 'Progressive House', 'Psytrance',
  'Tech House', 'Techno', 'Trance', 'Tribal House', 'UK Bass',
] as const;
export type MusicGenre = typeof MUSIC_GENRES[number];
export type EventStatus = 'scheduled' | 'live' | 'reconnecting' | 'ended';
export type StreamHealth = 'excellent' | 'good' | 'poor' | 'disconnected';
export type ReactionType = 'fire' | 'heart' | 'clap' | 'wave' | 'skull';

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  fire: '\uD83D\uDD25',
  heart: '\u2764\uFE0F',
  clap: '\uD83D\uDC4F',
  wave: '\uD83D\uDC4B',
  skull: '\uD83D\uDC80',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: 'Programmé',
  live: 'En direct',
  reconnecting: 'Connexion instable',
  ended: 'Terminé',
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  scheduled: '#7b74c8',
  live: '#ef4444',
  reconnecting: '#eab308',
  ended: 'rgba(240, 239, 244, 0.3)',
};
