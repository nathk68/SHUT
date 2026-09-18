import { ChatMessage } from '../../types';

const now = new Date();
const minAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'msg-001', eventId: 'evt-001', userId: 'chat-u1', userName: 'TechnoFan92', userAvatarUrl: null, text: 'Ce drop était insane !', timestamp: minAgo(12), type: 'message' },
  { id: 'msg-002', eventId: 'evt-001', userId: 'chat-u2', userName: 'BassDrop', userAvatarUrl: null, text: 'Son de malade', timestamp: minAgo(10), type: 'message' },
  { id: 'msg-003', eventId: 'evt-001', userId: 'chat-u3', userName: 'NightOwl', userAvatarUrl: null, text: 'Best set ever !', timestamp: minAgo(8), type: 'message' },
  { id: 'msg-004', eventId: 'evt-001', userId: 'chat-u4', userName: 'DeepVibes', userAvatarUrl: null, text: 'Quelle ambiance', timestamp: minAgo(6), type: 'message' },
  { id: 'msg-005', eventId: 'evt-001', userId: 'chat-u5', userName: 'SynthWave', userAvatarUrl: null, text: 'SHUT > tout le reste', timestamp: minAgo(4), type: 'message' },
  { id: 'msg-006', eventId: 'evt-001', userId: 'chat-u6', userName: 'RaveMaster', userAvatarUrl: null, text: 'La qualité audio est dingue', timestamp: minAgo(3), type: 'message' },
  { id: 'msg-007', eventId: 'evt-001', userId: 'chat-u7', userName: 'BeatJunkie', userAvatarUrl: null, text: 'On veut plus !', timestamp: minAgo(2), type: 'message' },
  { id: 'msg-008', eventId: 'evt-001', userId: 'chat-u8', userName: 'VinylHead', userAvatarUrl: null, text: 'Quel talent', timestamp: minAgo(1), type: 'message' },
];

export const MOCK_CHAT_PHRASES = [
  'Énorme !',
  'Le son est parfait',
  'DROP !',
  'Quelle ambiance',
  'Best set ever',
  'On veut plus !',
  'SHUT > tout le reste',
  'La qualité audio est dingue',
  'Qui est ce DJ ?',
  'Quel talent',
  'Je kiffe trop',
  'Volume à fond',
  'Incroyable',
  'La basse tremble',
  'Encore encore encore',
  'Set de l\'année',
];
