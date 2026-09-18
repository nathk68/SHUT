import { ReactionType } from '../config/constants';

export interface ChatMessage {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  text: string;
  timestamp: string;
  type: 'message' | 'reaction' | 'system';
}

export interface Reaction {
  id: string;
  eventId: string;
  userId: string;
  type: ReactionType;
  timestamp: string;
}
