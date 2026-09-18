import { User } from '../../types';
import { UserRole } from '../../config/constants';

export interface IAuthService {
  login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  register(email: string, password: string, displayName: string, role: UserRole): Promise<{ success: boolean; user?: User; error?: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
