import { USE_MOCK } from '../config/constants';

// Real service imports (Firebase + Mux)
import { FirebaseAuthService } from './auth/auth.firebase';
import { FirebaseEventsService } from './events/events.firebase';
import { MuxStreamingService } from './streaming/streaming.mux';
import { FirebaseChatService } from './chat/chat.firebase';
import { FirebaseFavoritesService } from './favorites/favorites.firebase';
import { FirebaseLikesService } from './likes/likes.firebase';
import { FirebaseFollowService } from './follow/follow.firebase';
import { FirebaseUserService } from './user/user.firebase';
import { FirebaseReplaysService } from './replays/replays.firebase';
import { FirebaseNotificationsService } from './notifications/notifications.firebase';

// Mock service imports (for development/demo without API keys)
import { MockAuthService } from './auth/auth.mock';
import { MockEventsService } from './events/events.mock';
import { MockStreamingService } from './streaming/streaming.mock';
import { MockChatService } from './chat/chat.mock';
import { MockFavoritesService } from './favorites/favorites.mock';
import { MockLikesService } from './likes/likes.mock';
import { MockFollowService } from './follow/follow.mock';
import { MockUserService } from './user/user.mock';
import { MockReplaysService } from './replays/replays.mock';
import { MockNotificationsService } from './notifications/notifications.mock';

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

export const favoritesService = USE_MOCK
  ? new MockFavoritesService()
  : new FirebaseFavoritesService();

export const likesService = USE_MOCK
  ? new MockLikesService()
  : new FirebaseLikesService();

export const followService = USE_MOCK
  ? new MockFollowService()
  : new FirebaseFollowService();

export const userService = USE_MOCK
  ? new MockUserService()
  : new FirebaseUserService();

export const replaysService = USE_MOCK
  ? new MockReplaysService()
  : new FirebaseReplaysService();

export const notificationsService = USE_MOCK
  ? new MockNotificationsService()
  : new FirebaseNotificationsService();
