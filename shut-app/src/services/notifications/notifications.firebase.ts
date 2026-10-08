import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import type { INotificationsService } from './notifications.service';
import type { AppNotification } from '../../types/notification';

const COLLECTION = 'notifications';

export class FirebaseNotificationsService implements INotificationsService {
  private col = collection(db, COLLECTION);

  async getNotifications(userId: string, limitCount = 50): Promise<AppNotification[]> {
    const q = query(
      this.col,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
  }

  onNotifications(userId: string, callback: (notifications: AppNotification[]) => void): () => void {
    const q = query(
      this.col,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    return onSnapshot(q, (snap) => {
      const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
      callback(notifications);
    });
  }

  onUnreadCount(userId: string, callback: (count: number) => void): () => void {
    const q = query(
      this.col,
      where('userId', '==', userId),
      where('read', '==', false),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.size);
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, notificationId), { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      this.col,
      where('userId', '==', userId),
      where('read', '==', false),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  }
}
