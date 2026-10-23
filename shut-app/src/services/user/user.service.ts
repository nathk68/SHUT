import type { User } from '../../types/user';
import type { UpdateProfilePayload } from '../../types/profile';

export interface IUserService {
  getUserById(userId: string): Promise<User | null>;
  /** Get all users with role broadcaster (DJs) */
  getDJs(): Promise<User[]>;
  updateProfile(userId: string, payload: UpdateProfilePayload): Promise<User>;
  uploadAvatar(userId: string, localUri: string): Promise<string>;
}
