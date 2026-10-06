import { UserRole } from '../config/constants';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  festivalId: string | null;
  createdAt: string;
  // Onboarding — champs communs
  username?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  genres?: string[];
  cityName?: string;
  countryCode?: string;
  cityId?: string;
  // Onboarding — DJ / DA
  artistName?: string;
  applicationRole?: 'dj' | 'artistic_director';
  // Profile
  bio?: string;
  representedCityName?: string;
  representedCountryCode?: string;
  socialLinks?: {
    instagram?: string;
    soundcloud?: string;
    mixcloud?: string;
    youtube?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    spotify?: string;
  };
  experience?: 'debutant' | 'intermediaire' | 'confirme' | 'professionnel';
  followersCount?: number;
  followingCount?: number;
  totalLikesCount?: number;
  language?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
}
