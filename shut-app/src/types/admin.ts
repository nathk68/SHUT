export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ApplicationType = 'dj' | 'artistic_director';

export interface DJApplication {
  id: string;
  userId: string;
  artistName: string;
  bio: string;
  genres: string[];
  experience?: 'debutant' | 'intermediaire' | 'confirme' | 'professionnel';
  worksLinks: string[];
  cityName: string;
  countryCode: string;
  cityId: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DAApplication {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  venueName: string;
  venueType: string;
  venueCapacity: string;
  venueLink: string;
  venueDescription: string;
  cityName: string;
  countryCode: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type ReportReason = 'inappropriate' | 'spam' | 'harassment' | 'copyright' | 'other';
export type ReportTargetType = 'user' | 'event' | 'replay';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';
export type ReportAction = 'none' | 'warning' | 'content_removed' | 'user_banned';

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  action?: ReportAction;
}

export type StatsPeriod = 'day' | 'week' | 'month' | 'year';

export interface AdminStats {
  totalUsers: number;
  totalBroadcasters: number;
  totalLivesActive: number;
  totalReplays: number;
  pendingApplications: number;
  pendingReports: number;
}

export interface StatsDataPoint {
  label: string;
  value: number;
}
