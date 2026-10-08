export type NotificationType =
  | 'new_follower'
  | 'live_started'
  | 'application_approved'
  | 'application_rejected'
  | 'admin_announcement'
  | 'new_application';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  // Actor (who triggered)
  actorId?: string;
  actorName?: string;
  actorAvatarUrl?: string | null;
  // Target (what to navigate to)
  targetId?: string;
  targetLabel?: string;
  // For admin_announcement
  message?: string;
}
