import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

jest.mock('../../services/index', () => ({
  authService: {
    getCurrentUser: jest.fn().mockResolvedValue(null),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
  userService: {
    getUserById: jest.fn().mockResolvedValue({
      id: 'user-viewer-001',
      email: 'alex@example.com',
      username: 'alexmartin',
      displayName: 'Alex Martin',
      role: 'viewer',
      createdAt: '2026-09-23T00:00:00.000Z',
      bio: 'Updated bio',
    }),
    updateProfile: jest.fn().mockResolvedValue({
      id: 'user-viewer-001',
      email: 'alex@example.com',
      username: 'alexmartin',
      displayName: 'Alex Martin',
      role: 'viewer',
      createdAt: '2026-09-23T00:00:00.000Z',
      bio: 'Updated bio',
    }),
    uploadAvatar: jest.fn().mockResolvedValue('https://example.com/avatar.jpg'),
  },
  favoritesService: { getFavorites: jest.fn().mockResolvedValue([]), addFavorite: jest.fn(), removeFavorite: jest.fn(), isFavorite: jest.fn().mockResolvedValue(false) },
  likesService: { getLikes: jest.fn().mockResolvedValue([]), toggleLike: jest.fn().mockResolvedValue(false), isLiked: jest.fn().mockResolvedValue(false) },
  followService: { isFollowing: jest.fn().mockResolvedValue(false), follow: jest.fn(), unfollow: jest.fn(), getFollowing: jest.fn().mockResolvedValue([]), getFollowers: jest.fn().mockResolvedValue([]) },
}));

jest.mock('../../utils/storage', () => ({
  getStoredData: jest.fn().mockResolvedValue(null),
  setStoredData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../config/firebase.config', () => ({ auth: {}, db: {}, storage: {} }));

function TestConsumer({ onUpdateUser }: { onUpdateUser: (fn: (patch: Record<string, unknown>) => Promise<void>) => void }) {
  const { updateUser } = useAuth();
  React.useEffect(() => { onUpdateUser(updateUser as unknown as (patch: Record<string, unknown>) => Promise<void>); }, [updateUser, onUpdateUser]);
  return <Text testID="ok">ok</Text>;
}

describe('AuthContext.updateUser', () => {
  it('updateUser exists on context', async () => {
    let capturedFn: ((patch: Record<string, unknown>) => Promise<void>) | undefined;
    render(
      <AuthProvider>
        <TestConsumer onUpdateUser={(fn) => { capturedFn = fn; }} />
      </AuthProvider>
    );
    await waitFor(() => expect(capturedFn).toBeDefined());
    expect(typeof capturedFn).toBe('function');
  });
});
