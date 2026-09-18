import * as Crypto from 'expo-crypto';
import { IChatService } from './chat.service';
import { ChatMessage } from '../../types';
import { MOCK_CHAT_MESSAGES, MOCK_CHAT_PHRASES } from '../_mock-data/chat-messages';
import { MOCK_CHAT_USERS } from '../_mock-data/users';

export class MockChatService implements IChatService {
  private messages: Map<string, ChatMessage[]> = new Map();
  private listeners: Map<string, Set<(msg: ChatMessage) => void>> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  async getMessages(eventId: string): Promise<ChatMessage[]> {
    if (!this.messages.has(eventId)) {
      this.messages.set(eventId, [...MOCK_CHAT_MESSAGES.filter(m => m.eventId === eventId)]);
    }
    return this.messages.get(eventId)!;
  }

  async sendMessage(eventId: string, userId: string, userName: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = {
      id: `msg-${Crypto.randomUUID().slice(0, 8)}`,
      eventId,
      userId,
      userName,
      userAvatarUrl: null,
      text,
      timestamp: new Date().toISOString(),
      type: 'message',
    };

    if (!this.messages.has(eventId)) {
      this.messages.set(eventId, []);
    }
    this.messages.get(eventId)!.push(msg);

    // Notify listeners
    this.listeners.get(eventId)?.forEach(cb => cb(msg));

    return msg;
  }

  onNewMessage(eventId: string, callback: (message: ChatMessage) => void): () => void {
    if (!this.listeners.has(eventId)) {
      this.listeners.set(eventId, new Set());
    }
    this.listeners.get(eventId)!.add(callback);

    // Start auto-generating messages if not already
    if (!this.intervals.has(eventId)) {
      const interval = setInterval(() => {
        const user = MOCK_CHAT_USERS[Math.floor(Math.random() * MOCK_CHAT_USERS.length)];
        const text = MOCK_CHAT_PHRASES[Math.floor(Math.random() * MOCK_CHAT_PHRASES.length)];
        const msg: ChatMessage = {
          id: `msg-auto-${Crypto.randomUUID().slice(0, 8)}`,
          eventId,
          userId: user.id,
          userName: user.name,
          userAvatarUrl: null,
          text,
          timestamp: new Date().toISOString(),
          type: 'message',
        };

        if (!this.messages.has(eventId)) {
          this.messages.set(eventId, []);
        }
        this.messages.get(eventId)!.push(msg);
        this.listeners.get(eventId)?.forEach(cb => cb(msg));
      }, 2500 + Math.random() * 3000);

      this.intervals.set(eventId, interval);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventId)?.delete(callback);
      if (this.listeners.get(eventId)?.size === 0) {
        const interval = this.intervals.get(eventId);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(eventId);
        }
      }
    };
  }
}
