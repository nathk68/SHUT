import type { User } from '../../types/user';
import type { UpdateProfilePayload } from '../../types/profile';

export interface IUserService {
  getUserById(userId: string): Promise<User | null>;
  updateProfile(userId: string, payload: UpdateProfilePayload): Promise<User>;
  uploadAvatar(userId: string, localUri: string): Promise<string>;
}
