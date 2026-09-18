// Toggle this single flag to switch from mock to real services
export const USE_MOCK = false;

export type UserRole = 'viewer' | 'broadcaster';
export type EventStatus = 'scheduled' | 'live' | 'ended';
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
  ended: 'Terminé',
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  scheduled: '#7b74c8',
  live: '#ef4444',
  ended: 'rgba(240, 239, 244, 0.3)',
};
