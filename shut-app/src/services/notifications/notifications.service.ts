import type { AppNotification } from '../../types/notification';

export interface INotificationsService {
  getNotifications(userId: string, limitCount?: number): Promise<AppNotification[]>;
  onNotifications(userId: string, callback: (notifications: AppNotification[]) => void): () => void;
  onUnreadCount(userId: string, callback: (count: number) => void): () => void;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}
