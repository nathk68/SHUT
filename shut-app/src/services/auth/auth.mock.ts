import * as Crypto from 'expo-crypto';
import { IAuthService } from './auth.service';
import { User } from '../../types';
import { UserRole } from '../../config/constants';
import { MOCK_USERS } from '../_mock-data/users';
import { getStoredData, setStoredData, removeStoredData } from '../../utils/storage';

const AUTH_KEY = '@shut_auth';
const USERS_KEY = '@shut_users';

export class MockAuthService implements IAuthService {
  private async getUsers(): Promise<(User & { password: string })[]> {
    const stored = await getStoredData<(User & { password: string })[]>(USERS_KEY);
    if (stored) return stored;
    await setStoredData(USERS_KEY, MOCK_USERS);
    return [...MOCK_USERS];
  }

  async login(email: string, password: string) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const users = await this.getUsers();
    const found = users.find(u => u.email === email && u.password === password);

    if (!found) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    const { password: _, ...user } = found;
    await setStoredData(AUTH_KEY, user);
    return { success: true, user };
  }

  async register(email: string, password: string, displayName: string, role: UserRole) {
    await new Promise(r => setTimeout(r, 800));

    const users = await this.getUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Cet email est déjà utilisé' };
    }

    const newUser: User & { password: string } = {
      id: `user-${Crypto.randomUUID().slice(0, 8)}`,
      email,
      password,
      displayName,
      avatarUrl: null,
      role,
      festivalId: role === 'broadcaster' ? 'fest-001' : null,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await setStoredData(USERS_KEY, users);

    const { password: _, ...user } = newUser;
    await setStoredData(AUTH_KEY, user);
    return { success: true, user };
  }

  async logout() {
    await removeStoredData(AUTH_KEY);
  }

  async getCurrentUser() {
    return getStoredData<User>(AUTH_KEY);
  }
}
