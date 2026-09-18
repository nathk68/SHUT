import { ref, push, onChildAdded, query as rtdbQuery, orderByChild, limitToLast, off } from 'firebase/database';
import { rtdb } from '../../config/firebase.config';
import { IChatService } from './chat.service';
import { ChatMessage } from '../../types';

export class FirebaseChatService implements IChatService {

  async getMessages(eventId: string): Promise<ChatMessage[]> {
    const chatRef = ref(rtdb, `chat/${eventId}`);
    const q = rtdbQuery(chatRef, orderByChild('timestamp'), limitToLast(50));

    return new Promise((resolve) => {
      const messages: ChatMessage[] = [];
      const unsub = onChildAdded(q, (snapshot) => {
        messages.push({ id: snapshot.key!, ...snapshot.val() } as ChatMessage);
      });

      setTimeout(() => {
        off(q);
        resolve(messages);
      }, 1000);
    });
  }

  async sendMessage(eventId: string, userId: string, userName: string, text: string): Promise<ChatMessage> {
    const chatRef = ref(rtdb, `chat/${eventId}`);
    const message = {
      eventId,
      userId,
      userName,
      userAvatarUrl: null,
      text,
      timestamp: new Date().toISOString(),
      type: 'message' as const,
    };

    const newRef = await push(chatRef, message);
    return { id: newRef.key!, ...message };
  }

  onNewMessage(eventId: string, callback: (message: ChatMessage) => void): () => void {
    const chatRef = ref(rtdb, `chat/${eventId}`);
    const q = rtdbQuery(chatRef, orderByChild('timestamp'), limitToLast(1));

    let isFirstLoad = true;

    onChildAdded(q, (snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false;
        return;
      }
      const msg = { id: snapshot.key!, ...snapshot.val() } as ChatMessage;
      callback(msg);
    });

    return () => {
      off(q);
    };
  }
}
