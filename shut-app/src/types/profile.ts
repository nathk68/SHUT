export type ExperienceLevel = 'debutant' | 'intermediaire' | 'confirme' | 'professionnel';

export interface SocialLinks {
  instagram?: string;
  soundcloud?: string;
  mixcloud?: string;
  youtube?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  spotify?: string;
}

export interface UpdateProfilePayload {
  username?: string;
  artistName?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  avatarUrl?: string;
  bio?: string;
  musicGenres?: string[];
  representedCityName?: string;
  representedCountryCode?: string;
  experience?: ExperienceLevel;
  socialLinks?: SocialLinks;
}

export interface UserFollow {
  id: string;
  followerId: string;
  followeeId: string;
  followedAt: string;
}
