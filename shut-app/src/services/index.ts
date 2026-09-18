import { USE_MOCK } from '../config/constants';

// Real service imports (Firebase + Mux)
import { FirebaseAuthService } from './auth/auth.firebase';
import { FirebaseEventsService } from './events/events.firebase';
import { MuxStreamingService } from './streaming/streaming.mux';
import { FirebaseChatService } from './chat/chat.firebase';

// Mock service imports (for development/demo without API keys)
import { MockAuthService } from './auth/auth.mock';
import { MockEventsService } from './events/events.mock';
import { MockStreamingService } from './streaming/streaming.mock';
import { MockChatService } from './chat/chat.mock';

// ====================================================================
// SERVICE FACTORY
// Toggle USE_MOCK in config/constants.ts to switch between mock and real
// ====================================================================

export const authService = USE_MOCK
  ? new MockAuthService()
  : new FirebaseAuthService();

export const eventsService = USE_MOCK
  ? new MockEventsService()
  : new FirebaseEventsService();

export const streamingService = USE_MOCK
  ? new MockStreamingService()
  : new MuxStreamingService();

export const chatService = USE_MOCK
  ? new MockChatService()
  : new FirebaseChatService();
