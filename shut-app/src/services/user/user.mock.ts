import type { User } from '../../types/user';
import type { UpdateProfilePayload } from '../../types/profile';
import type { IUserService } from './user.service';
import { MOCK_USERS } from '../_mock-data/users';

export class MockUserService implements IUserService {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map(MOCK_USERS.map((u) => [u.id, { ...u }]));
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) ?? null;
  }

  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    const updated: User = { ...user, ...payload };
    this.users.set(userId, updated);
    return updated;
  }

  async uploadAvatar(_userId: string, _localUri: string): Promise<string> {
    return `https://mock-storage.example.com/avatars/${_userId}-${Date.now()}.jpg`;
  }
}
