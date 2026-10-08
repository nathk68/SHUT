import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationsService } from '../services';
import { registerForPushNotifications, setupNotificationHandler, addNotificationResponseListener } from '../utils/pushNotifications';
import type { AppNotification } from '../types/notification';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Register push notifications
  const pushRegistered = useRef(false);
  useEffect(() => {
    if (!user || pushRegistered.current) return;
    pushRegistered.current = true;
    setupNotificationHandler();
    registerForPushNotifications(user.id).catch(() => {});
  }, [user?.id]);

  // Handle notification taps (when app is in background)
  useEffect(() => {
    const sub = addNotificationResponseListener(() => {
      // The NotificationFeedScreen will show all notifications
    });
    return () => sub.remove();
  }, []);

  // Real-time listener for notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const unsubNotifs = notificationsService.onNotifications(user.id, setNotifications);
    const unsubCount = notificationsService.onUnreadCount(user.id, setUnreadCount);
    return () => {
      unsubNotifs();
      unsubCount();
    };
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await notificationsService.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await notificationsService.markAllAsRead(user.id);
  }, [user?.id]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
