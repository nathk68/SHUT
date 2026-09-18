import { ChatMessage } from '../../types';

export interface IChatService {
  getMessages(eventId: string): Promise<ChatMessage[]>;
  sendMessage(eventId: string, userId: string, userName: string, text: string): Promise<ChatMessage>;
  onNewMessage(eventId: string, callback: (message: ChatMessage) => void): () => void;
}
