import type { INotificationsService } from './notifications.service';
import type { AppNotification } from '../../types/notification';

export class MockNotificationsService implements INotificationsService {
  private notifications: AppNotification[] = [];

  async getNotifications(_userId: string): Promise<AppNotification[]> {
    return this.notifications;
  }

  onNotifications(_userId: string, callback: (notifications: AppNotification[]) => void): () => void {
    callback(this.notifications);
    return () => {};
  }

  onUnreadCount(_userId: string, callback: (count: number) => void): () => void {
    callback(0);
    return () => {};
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notif = this.notifications.find((n) => n.id === notificationId);
    if (notif) notif.read = true;
  }

  async markAllAsRead(_userId: string): Promise<void> {
    this.notifications.forEach((n) => { n.read = true; });
  }
}
