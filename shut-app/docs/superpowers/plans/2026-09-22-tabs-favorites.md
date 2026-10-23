# Tabs Refactor + Favorites System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename navigation tabs, add role-based tab content (Mes favoris / Ma discothèque), and build a Firebase-backed favorites + likes system with a TikTok-style action bar in the live player.

**Architecture:** Services follow existing class-based pattern (mock + firebase). A `FavoritesContext` holds favorite/liked IDs in memory (Set) and performs optimistic updates. The `LiveActionBar` component is positioned absolutely on the right of `LivePlayerScreen`.

**Tech Stack:** React Native (Expo), Firebase Firestore, @react-navigation/bottom-tabs, @testing-library/react-native, Jest

**Spec:** `docs/superpowers/specs/2026-09-22-tabs-favorites-design.md`

## Global Constraints

- Follow existing class-based service pattern: interface file + `.mock.ts` + `.firebase.ts`
- `USE_MOCK` flag in `src/config/constants.ts` controls mock vs real
- `db` is exported from `src/config/firebase.config.ts` (Firestore instance)
- All colors from `src/config/theme.ts` — accent purple = `colors.accent`, `'rgba(124,58,237,0.3)'` for semi-transparent backgrounds
- Tests use `@testing-library/react-native` with `render` and `screen`
- No new external packages — use only what is already installed
- Firestore collections: `userFavorites`, `userLikes`

---

### Task 1: Types & barrel export

**Files:**
- Create: `src/types/favorite.ts`
- Modify: `src/types/index.ts`
- Test: `src/__tests__/types/favorite.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `UserFavorite`, `UserLike` — used by services and context in later tasks

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/types/favorite.test.ts
import { UserFavorite, UserLike } from '../../types/favorite';

describe('UserFavorite type', () => {
  it('satisfies the expected shape', () => {
    const fav: UserFavorite = {
      id: 'fav-1',
      userId: 'user-1',
      eventId: 'event-1',
      addedAt: new Date().toISOString(),
    };
    expect(fav.userId).toBe('user-1');
    expect(fav.eventId).toBe('event-1');
  });
});

describe('UserLike type', () => {
  it('satisfies the expected shape', () => {
    const like: UserLike = {
      id: 'like-1',
      userId: 'user-1',
      eventId: 'event-1',
      likedAt: new Date().toISOString(),
    };
    expect(like.userId).toBe('user-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/types/favorite.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module '../../types/favorite'"

- [ ] **Step 3: Create `src/types/favorite.ts`**

```ts
export interface UserFavorite {
  id: string;
  userId: string;
  eventId: string;
  addedAt: string; // ISO date
}

export interface UserLike {
  id: string;
  userId: string;
  eventId: string;
  likedAt: string; // ISO date
}
```

- [ ] **Step 4: Update `src/types/index.ts`** — add at the end:

```ts
export type { UserFavorite, UserLike } from './favorite';
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/__tests__/types/favorite.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/favorite.ts src/types/index.ts src/__tests__/types/favorite.test.ts
git commit -m "feat: add UserFavorite and UserLike types"
```

---

### Task 2: favoritesService (interface + mock + firebase)

**Files:**
- Create: `src/services/favorites/favorites.service.ts`
- Create: `src/services/favorites/favorites.mock.ts`
- Create: `src/services/favorites/favorites.firebase.ts`
- Test: `src/__tests__/services/favorites.test.ts`

**Interfaces:**
- Consumes: nothing (services are standalone)
- Produces: `IFavoritesService`, `MockFavoritesService`, `FirebaseFavoritesService` — used by Task 4 (services/index.ts)

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/services/favorites.test.ts
import { MockFavoritesService } from '../../services/favorites/favorites.mock';

describe('MockFavoritesService', () => {
  let svc: MockFavoritesService;

  beforeEach(() => {
    svc = new MockFavoritesService();
  });

  it('démarre avec une liste vide', async () => {
    const favs = await svc.getFavorites('user-1');
    expect(favs).toEqual([]);
  });

  it('ajoute un favori', async () => {
    await svc.addFavorite('user-1', 'event-1');
    const favs = await svc.getFavorites('user-1');
    expect(favs).toContain('event-1');
  });

  it('supprime un favori', async () => {
    await svc.addFavorite('user-1', 'event-1');
    await svc.removeFavorite('user-1', 'event-1');
    const favs = await svc.getFavorites('user-1');
    expect(favs).not.toContain('event-1');
  });

  it('vérifie si un favori existe', async () => {
    await svc.addFavorite('user-1', 'event-1');
    expect(await svc.isFavorite('user-1', 'event-1')).toBe(true);
    expect(await svc.isFavorite('user-1', 'event-2')).toBe(false);
  });

  it('isole les favoris par utilisateur', async () => {
    await svc.addFavorite('user-1', 'event-1');
    expect(await svc.getFavorites('user-2')).toEqual([]);
  });

  it('n\'ajoute pas en double', async () => {
    await svc.addFavorite('user-1', 'event-1');
    await svc.addFavorite('user-1', 'event-1');
    const favs = await svc.getFavorites('user-1');
    expect(favs.filter(id => id === 'event-1')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/services/favorites.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Create `src/services/favorites/favorites.service.ts`**

```ts
export interface IFavoritesService {
  getFavorites(userId: string): Promise<string[]>;
  addFavorite(userId: string, eventId: string): Promise<void>;
  removeFavorite(userId: string, eventId: string): Promise<void>;
  isFavorite(userId: string, eventId: string): Promise<boolean>;
}
```

- [ ] **Step 4: Create `src/services/favorites/favorites.mock.ts`**

```ts
import { IFavoritesService } from './favorites.service';

export class MockFavoritesService implements IFavoritesService {
  private store = new Map<string, Set<string>>();

  private getSet(userId: string): Set<string> {
    if (!this.store.has(userId)) this.store.set(userId, new Set());
    return this.store.get(userId)!;
  }

  async getFavorites(userId: string): Promise<string[]> {
    return Array.from(this.getSet(userId));
  }

  async addFavorite(userId: string, eventId: string): Promise<void> {
    this.getSet(userId).add(eventId);
  }

  async removeFavorite(userId: string, eventId: string): Promise<void> {
    this.getSet(userId).delete(eventId);
  }

  async isFavorite(userId: string, eventId: string): Promise<boolean> {
    return this.getSet(userId).has(eventId);
  }
}
```

- [ ] **Step 5: Create `src/services/favorites/favorites.firebase.ts`**

```ts
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { IFavoritesService } from './favorites.service';

export class FirebaseFavoritesService implements IFavoritesService {
  async getFavorites(userId: string): Promise<string[]> {
    const q = query(
      collection(db, 'userFavorites'),
      where('userId', '==', userId),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().eventId as string);
  }

  async addFavorite(userId: string, eventId: string): Promise<void> {
    const exists = await this.isFavorite(userId, eventId);
    if (exists) return;
    await addDoc(collection(db, 'userFavorites'), {
      userId,
      eventId,
      addedAt: new Date().toISOString(),
    });
  }

  async removeFavorite(userId: string, eventId: string): Promise<void> {
    const q = query(
      collection(db, 'userFavorites'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
    );
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'userFavorites', d.id))));
  }

  async isFavorite(userId: string, eventId: string): Promise<boolean> {
    const q = query(
      collection(db, 'userFavorites'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx jest src/__tests__/services/favorites.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/services/favorites/ src/__tests__/services/favorites.test.ts
git commit -m "feat: add favoritesService (mock + firebase)"
```

---

### Task 3: likesService (interface + mock + firebase)

**Files:**
- Create: `src/services/likes/likes.service.ts`
- Create: `src/services/likes/likes.mock.ts`
- Create: `src/services/likes/likes.firebase.ts`
- Test: `src/__tests__/services/likes.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `ILikesService`, `MockLikesService`, `FirebaseLikesService` — used by Task 4

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/services/likes.test.ts
import { MockLikesService } from '../../services/likes/likes.mock';

describe('MockLikesService', () => {
  let svc: MockLikesService;

  beforeEach(() => {
    svc = new MockLikesService();
  });

  it('démarre sans likes', async () => {
    expect(await svc.getLikes('user-1')).toEqual([]);
  });

  it('like un event (toggleLike retourne true)', async () => {
    const result = await svc.toggleLike('user-1', 'event-1');
    expect(result).toBe(true);
    expect(await svc.isLiked('user-1', 'event-1')).toBe(true);
  });

  it('unlike un event déjà liké (toggleLike retourne false)', async () => {
    await svc.toggleLike('user-1', 'event-1');
    const result = await svc.toggleLike('user-1', 'event-1');
    expect(result).toBe(false);
    expect(await svc.isLiked('user-1', 'event-1')).toBe(false);
  });

  it('getLikes retourne les eventIds likés', async () => {
    await svc.toggleLike('user-1', 'event-1');
    await svc.toggleLike('user-1', 'event-2');
    const likes = await svc.getLikes('user-1');
    expect(likes).toContain('event-1');
    expect(likes).toContain('event-2');
  });

  it('isole les likes par utilisateur', async () => {
    await svc.toggleLike('user-1', 'event-1');
    expect(await svc.isLiked('user-2', 'event-1')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/services/likes.test.ts --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Create `src/services/likes/likes.service.ts`**

```ts
export interface ILikesService {
  getLikes(userId: string): Promise<string[]>;
  toggleLike(userId: string, eventId: string): Promise<boolean>; // returns new liked state
  isLiked(userId: string, eventId: string): Promise<boolean>;
}
```

- [ ] **Step 4: Create `src/services/likes/likes.mock.ts`**

```ts
import { ILikesService } from './likes.service';

export class MockLikesService implements ILikesService {
  private store = new Map<string, Set<string>>();

  private getSet(userId: string): Set<string> {
    if (!this.store.has(userId)) this.store.set(userId, new Set());
    return this.store.get(userId)!;
  }

  async getLikes(userId: string): Promise<string[]> {
    return Array.from(this.getSet(userId));
  }

  async toggleLike(userId: string, eventId: string): Promise<boolean> {
    const set = this.getSet(userId);
    if (set.has(eventId)) {
      set.delete(eventId);
      return false;
    }
    set.add(eventId);
    return true;
  }

  async isLiked(userId: string, eventId: string): Promise<boolean> {
    return this.getSet(userId).has(eventId);
  }
}
```

- [ ] **Step 5: Create `src/services/likes/likes.firebase.ts`**

```ts
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { ILikesService } from './likes.service';

export class FirebaseLikesService implements ILikesService {
  async getLikes(userId: string): Promise<string[]> {
    const q = query(
      collection(db, 'userLikes'),
      where('userId', '==', userId),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().eventId as string);
  }

  async toggleLike(userId: string, eventId: string): Promise<boolean> {
    const q = query(
      collection(db, 'userLikes'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'userLikes', d.id))));
      return false;
    }
    await addDoc(collection(db, 'userLikes'), {
      userId,
      eventId,
      likedAt: new Date().toISOString(),
    });
    return true;
  }

  async isLiked(userId: string, eventId: string): Promise<boolean> {
    const q = query(
      collection(db, 'userLikes'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx jest src/__tests__/services/likes.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/services/likes/ src/__tests__/services/likes.test.ts
git commit -m "feat: add likesService (mock + firebase)"
```

---

### Task 4: Expose services in services/index.ts

**Files:**
- Modify: `src/services/index.ts`

**Interfaces:**
- Consumes: `MockFavoritesService`, `FirebaseFavoritesService`, `MockLikesService`, `FirebaseLikesService` (Tasks 2 & 3)
- Produces: `favoritesService`, `likesService` — named exports consumed by FavoritesContext (Task 5)

- [ ] **Step 1: Update `src/services/index.ts`** — add after the existing imports and factory exports:

```ts
// Real service imports (Firebase + Mux)
import { FirebaseAuthService } from './auth/auth.firebase';
import { FirebaseEventsService } from './events/events.firebase';
import { MuxStreamingService } from './streaming/streaming.mux';
import { FirebaseChatService } from './chat/chat.firebase';
import { FirebaseFavoritesService } from './favorites/favorites.firebase';
import { FirebaseLikesService } from './likes/likes.firebase';

// Mock service imports (for development/demo without API keys)
import { MockAuthService } from './auth/auth.mock';
import { MockEventsService } from './events/events.mock';
import { MockStreamingService } from './streaming/streaming.mock';
import { MockChatService } from './chat/chat.mock';
import { MockFavoritesService } from './favorites/favorites.mock';
import { MockLikesService } from './likes/likes.mock';

// (existing exports unchanged)
export const authService = USE_MOCK ? new MockAuthService() : new FirebaseAuthService();
export const eventsService = USE_MOCK ? new MockEventsService() : new FirebaseEventsService();
export const streamingService = USE_MOCK ? new MockStreamingService() : new MuxStreamingService();
export const chatService = USE_MOCK ? new MockChatService() : new FirebaseChatService();

// New exports
export const favoritesService = USE_MOCK
  ? new MockFavoritesService()
  : new FirebaseFavoritesService();

export const likesService = USE_MOCK
  ? new MockLikesService()
  : new FirebaseLikesService();
```

Note: this is a complete rewrite of the file — keep the `USE_MOCK` import at the top.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors related to the new imports

- [ ] **Step 3: Commit**

```bash
git add src/services/index.ts
git commit -m "feat: expose favoritesService and likesService in service factory"
```

---

### Task 5: FavoritesContext

**Files:**
- Create: `src/contexts/FavoritesContext.tsx`
- Test: `src/__tests__/contexts/FavoritesContext.test.tsx`

**Interfaces:**
- Consumes: `favoritesService`, `likesService` (Task 4); `useAuth` from `AuthContext`
- Produces: `FavoritesProvider`, `useFavorites` — consumed by `LiveActionBar` (Task 8), `MesFavorisScreen` (Task 10)

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/contexts/FavoritesContext.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';
import { FavoritesProvider, useFavorites } from '../../contexts/FavoritesContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', displayName: 'Test User', avatarUrl: null },
    isAuthenticated: true,
    isGuest: false,
  }),
}));

jest.mock('../../services', () => ({
  favoritesService: {
    getFavorites: jest.fn().mockResolvedValue(['event-1', 'event-2']),
    addFavorite: jest.fn().mockResolvedValue(undefined),
    removeFavorite: jest.fn().mockResolvedValue(undefined),
  },
  likesService: {
    getLikes: jest.fn().mockResolvedValue(['event-3']),
    toggleLike: jest.fn().mockResolvedValue(true),
  },
}));

function TestConsumer() {
  const { isFavorite, isLiked, favoriteIds } = useFavorites();
  return (
    <>
      <Text testID="fav-count">{favoriteIds.size}</Text>
      <Text testID="is-fav-1">{String(isFavorite('event-1'))}</Text>
      <Text testID="is-liked-3">{String(isLiked('event-3'))}</Text>
    </>
  );
}

describe('FavoritesContext', () => {
  it('charge les favoris et likes de l\'utilisateur au mount', async () => {
    await act(async () => {
      render(
        <FavoritesProvider>
          <TestConsumer />
        </FavoritesProvider>
      );
    });
    expect(screen.getByTestId('fav-count').props.children).toBe(2);
    expect(screen.getByTestId('is-fav-1').props.children).toBe('true');
    expect(screen.getByTestId('is-liked-3').props.children).toBe('true');
  });

  it('lance une erreur si useFavorites est utilisé hors du provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow();
    consoleError.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/contexts/FavoritesContext.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Create `src/contexts/FavoritesContext.tsx`**

```tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { favoritesService, likesService } from '../services';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  likedIds: Set<string>;
  toggleFavorite: (eventId: string) => Promise<void>;
  toggleLike: (eventId: string) => Promise<void>;
  isFavorite: (eventId: string) => boolean;
  isLiked: (eventId: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      setLikedIds(new Set());
      return;
    }
    setIsLoading(true);
    Promise.all([
      favoritesService.getFavorites(user.id),
      likesService.getLikes(user.id),
    ])
      .then(([favs, likes]) => {
        setFavoriteIds(new Set(favs));
        setLikedIds(new Set(likes));
      })
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const toggleFavorite = useCallback(
    async (eventId: string) => {
      if (!user) return;
      const wasFav = favoriteIds.has(eventId);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (wasFav) next.delete(eventId);
        else next.add(eventId);
        return next;
      });
      if (wasFav) {
        await favoritesService.removeFavorite(user.id, eventId);
      } else {
        await favoritesService.addFavorite(user.id, eventId);
      }
    },
    [user, favoriteIds],
  );

  const toggleLike = useCallback(
    async (eventId: string) => {
      if (!user) return;
      const wasLiked = likedIds.has(eventId);
      setLikedIds(prev => {
        const next = new Set(prev);
        if (wasLiked) next.delete(eventId);
        else next.add(eventId);
        return next;
      });
      await likesService.toggleLike(user.id, eventId);
    },
    [user, likedIds],
  );

  const isFavorite = useCallback(
    (eventId: string) => favoriteIds.has(eventId),
    [favoriteIds],
  );

  const isLiked = useCallback(
    (eventId: string) => likedIds.has(eventId),
    [likedIds],
  );

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, likedIds, toggleFavorite, toggleLike, isFavorite, isLiked, isLoading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/contexts/FavoritesContext.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contexts/FavoritesContext.tsx src/__tests__/contexts/FavoritesContext.test.tsx
git commit -m "feat: add FavoritesContext with optimistic updates"
```

---

### Task 6: TabAvatar component

**Files:**
- Create: `src/components/ui/TabAvatar.tsx`
- Test: `src/__tests__/components/ui/TabAvatar.test.tsx`

**Interfaces:**
- Consumes: nothing external
- Produces: `TabAvatar` component — used by `MainTabs` (Task 7)
  ```ts
  interface TabAvatarProps {
    size: number;
    color: string;
    avatarUrl: string | null;
    displayName: string;
    focused: boolean;
    isGuest: boolean;
  }
  ```

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/ui/TabAvatar.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TabAvatar } from '../../../components/ui/TabAvatar';

const base = {
  size: 24,
  color: '#ffffff',
  avatarUrl: null,
  displayName: 'Nicolas',
  focused: false,
  isGuest: false,
};

describe('TabAvatar', () => {
  it('affiche la première lettre du nom quand pas d\'avatar', () => {
    render(<TabAvatar {...base} />);
    expect(screen.getByText('N')).toBeTruthy();
  });

  it('n\'affiche pas l\'initiale pour un guest', () => {
    render(<TabAvatar {...base} isGuest />);
    expect(screen.queryByText('N')).toBeNull();
  });

  it('n\'affiche pas l\'initiale quand avatarUrl est fourni', () => {
    render(<TabAvatar {...base} avatarUrl="https://example.com/pic.jpg" />);
    expect(screen.queryByText('N')).toBeNull();
  });

  it('gère un displayName vide sans crash', () => {
    render(<TabAvatar {...base} displayName="" />);
    expect(screen.getByText('?')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/components/ui/TabAvatar.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Create `src/components/ui/TabAvatar.tsx`**

```tsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../config/theme';

interface TabAvatarProps {
  size: number;
  color: string;
  avatarUrl: string | null;
  displayName: string;
  focused: boolean;
  isGuest: boolean;
}

export function TabAvatar({ size, color, avatarUrl, displayName, focused, isGuest }: TabAvatarProps) {
  if (isGuest) {
    return <Ionicons name="person-outline" size={size} color={color} />;
  }

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          { width: size, height: size, borderRadius: size / 2 },
          focused && styles.focusedBorder,
        ]}
      />
    );
  }

  const initial = (displayName || '').charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        focused && styles.focusedBorder,
      ]}
    >
      <Text style={{ color, fontFamily: fonts.heading.bold, fontSize: size * 0.5 }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusedBorder: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/components/ui/TabAvatar.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/TabAvatar.tsx src/__tests__/components/ui/TabAvatar.test.tsx
git commit -m "feat: add TabAvatar dynamic profile icon"
```

---

### Task 7: MainTabs navigation refactor

**Files:**
- Modify: `src/navigation/MainTabs.tsx`

**Interfaces:**
- Consumes: `TabAvatar` (Task 6); `MesFavorisScreen` (Task 10); `MaDiscothequeScreen` (Task 11) — import these once you've written them, for now use placeholder screens
- Produces: updated tab labels and role-based tab 4

Note: `MesFavorisScreen` and `MaDiscothequeScreen` don't exist yet. Import them with a forward-reference comment and use `PlaceholderScreen` temporarily. Come back to swap them in after Tasks 10 and 11.

- [ ] **Step 1: Rewrite `src/navigation/MainTabs.tsx`**

Replace the entire file with:

```tsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { ShutDiffusionScreen } from '../screens/ShutDiffusionScreen';
import { LivesScreen } from '../screens/LivesScreen';
import { GoLiveScreen } from '../screens/GoLiveScreen';
import { LivePlayerScreen } from '../screens/viewer/LivePlayerScreen';
import { AudioCheckScreen } from '../screens/broadcaster/AudioCheckScreen';
import { QuickStreamScreen } from '../screens/broadcaster/QuickStreamScreen';
import { LiveControlScreen } from '../screens/broadcaster/LiveControlScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/viewer/ProfileScreen';
import { TabAvatar } from '../components/ui/TabAvatar';
// Tasks 10 & 11: swap PlaceholderScreen with real screens once created
// import { MesFavorisScreen } from '../screens/MesFavorisScreen';
// import { MaDiscothequeScreen } from '../screens/MaDiscothequeScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type MainTabParamList = {
  ShutDiffusion: undefined;
  Live: { countryCode?: string } | undefined;
  GoLive: undefined;
  LiveClub: undefined;
  Parametres: undefined;
};

export type LiveStackParamList = {
  LivesMain: { countryCode?: string } | undefined;
  LivePlayer: { eventId: string };
};

export type GoLiveStackParamList = {
  GoLiveMain: undefined;
  AudioCheck: undefined;
  QuickStream: undefined;
  LiveControl: { eventId: string };
};

export type ParametresStackParamList = {
  SettingsMain: undefined;
  Profile: undefined;
};

// ─── Placeholder (remove after Tasks 10 & 11) ────────────────────────────────

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={placeholder.container}>
      <Text style={placeholder.text}>{title}</Text>
    </View>
  );
}

const placeholder = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
});

// ─── Stack navigators ─────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();
const LiveStack = createNativeStackNavigator<LiveStackParamList>();
const GoLiveStack = createNativeStackNavigator<GoLiveStackParamList>();
const ParametresStack = createNativeStackNavigator<ParametresStackParamList>();

function LiveStackScreen() {
  return (
    <LiveStack.Navigator screenOptions={{ headerShown: false }}>
      <LiveStack.Screen name="LivesMain" component={LivesScreen} />
      <LiveStack.Screen
        name="LivePlayer"
        component={LivePlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </LiveStack.Navigator>
  );
}

function GoLiveStackScreen() {
  return (
    <GoLiveStack.Navigator screenOptions={{ headerShown: false }}>
      <GoLiveStack.Screen name="GoLiveMain" component={GoLiveScreen} />
      <GoLiveStack.Screen name="AudioCheck" component={AudioCheckScreen} />
      <GoLiveStack.Screen name="QuickStream" component={QuickStreamScreen} />
      <GoLiveStack.Screen
        name="LiveControl"
        component={LiveControlScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </GoLiveStack.Navigator>
  );
}

function ParametresStackScreen() {
  return (
    <ParametresStack.Navigator screenOptions={{ headerShown: false }}>
      <ParametresStack.Screen name="SettingsMain" component={SettingsScreen} />
      <ParametresStack.Screen name="Profile" component={ProfileScreen} />
    </ParametresStack.Navigator>
  );
}

// ─── Main tabs ────────────────────────────────────────────────────────────────

export function MainTabs() {
  const { isAuthenticated, isGuest, user } = useAuth();
  const { currentRole } = useRole();
  const isDJ = isAuthenticated && currentRole === 'broadcaster';

  const liveClubLabel = isDJ ? 'Ma discothèque' : 'Mes favoris';
  // Swap PlaceholderScreen with MesFavorisScreen / MaDiscothequeScreen after Tasks 10 & 11
  const LiveClubComponent = isDJ
    ? () => <PlaceholderScreen title="Ma discothèque" />
    : () => <PlaceholderScreen title="Mes favoris" />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Parametres') {
            return (
              <TabAvatar
                size={size}
                color={color}
                avatarUrl={user?.avatarUrl ?? null}
                displayName={user?.username || user?.displayName || ''}
                focused={focused}
                isGuest={isGuest}
              />
            );
          }
          let iconName: keyof typeof Ionicons.glyphMap = 'compass-outline';
          if (route.name === 'ShutDiffusion') iconName = 'compass-outline';
          else if (route.name === 'Live') iconName = 'videocam-outline';
          else if (route.name === 'GoLive') iconName = 'radio-outline';
          else if (route.name === 'LiveClub') {
            iconName = isDJ ? 'musical-notes-outline' : 'heart-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="ShutDiffusion"
        component={ShutDiffusionScreen}
        options={{ tabBarLabel: 'Explorer' }}
      />
      <Tab.Screen
        name="Live"
        component={LiveStackScreen}
        options={{ tabBarLabel: 'En direct' }}
      />
      {isDJ && (
        <Tab.Screen
          name="GoLive"
          component={GoLiveStackScreen}
          options={{ tabBarLabel: 'DJ Live' }}
        />
      )}
      <Tab.Screen
        name="LiveClub"
        component={LiveClubComponent}
        options={{ tabBarLabel: liveClubLabel }}
      />
      <Tab.Screen
        name="Parametres"
        component={ParametresStackScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.backgroundElevated,
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors on this file

- [ ] **Step 3: Run the app and verify visually**

Launch `npx expo start` and check:
- Onglet 1: "Explorer" avec icône compass
- Onglet 2: "En direct" avec icône videocam
- Onglet 4: "Mes favoris" (viewer) ou "Ma discothèque" (DJ) selon rôle
- Onglet 5: "Profil" avec initiale ou avatar

- [ ] **Step 4: Commit**

```bash
git add src/navigation/MainTabs.tsx
git commit -m "feat: rename tabs and add role-based tab 4 with TabAvatar"
```

---

### Task 8: LiveActionBar component

**Files:**
- Create: `src/components/live/LiveActionBar.tsx`
- Test: `src/__tests__/components/live/LiveActionBar.test.tsx`

**Interfaces:**
- Consumes: `useFavorites` from `FavoritesContext` (Task 5)
- Produces: `LiveActionBar` component — consumed by `LivePlayerScreen` (Task 9)
  ```ts
  interface LiveActionBarProps {
    eventId: string;
    djAvatarUrl: string | null;
    djName: string;
  }
  ```

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/live/LiveActionBar.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LiveActionBar } from '../../../components/live/LiveActionBar';

const mockToggleFavorite = jest.fn();
const mockToggleLike = jest.fn();

jest.mock('../../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    isLiked: () => false,
    toggleFavorite: mockToggleFavorite,
    toggleLike: mockToggleLike,
  }),
}));

const props = {
  eventId: 'event-1',
  djAvatarUrl: null,
  djName: 'DJ Shadow',
};

describe('LiveActionBar', () => {
  beforeEach(() => {
    mockToggleFavorite.mockClear();
    mockToggleLike.mockClear();
  });

  it('affiche l\'initiale du DJ quand pas d\'avatar', () => {
    render(<LiveActionBar {...props} />);
    expect(screen.getByText('D')).toBeTruthy();
  });

  it('appelle toggleLike au clic sur le coeur', () => {
    render(<LiveActionBar {...props} />);
    fireEvent.press(screen.getByTestId('action-like'));
    expect(mockToggleLike).toHaveBeenCalledWith('event-1');
  });

  it('appelle toggleFavorite au clic sur le bookmark', () => {
    render(<LiveActionBar {...props} />);
    fireEvent.press(screen.getByTestId('action-favorite'));
    expect(mockToggleFavorite).toHaveBeenCalledWith('event-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/components/live/LiveActionBar.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Create `src/components/live/LiveActionBar.tsx`**

```tsx
import React from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '../../config/theme';
import { useFavorites } from '../../contexts/FavoritesContext';

interface LiveActionBarProps {
  eventId: string;
  djAvatarUrl: string | null;
  djName: string;
}

export function LiveActionBar({ eventId, djAvatarUrl, djName }: LiveActionBarProps) {
  const { isFavorite, isLiked, toggleFavorite, toggleLike } = useFavorites();
  const liked = isLiked(eventId);
  const favorited = isFavorite(eventId);

  const handleShare = async () => {
    await Share.share({ message: `Regarde ${djName} en live sur SHUT !` });
  };

  return (
    <View style={styles.container}>
      {/* Avatar DJ */}
      {djAvatarUrl ? (
        <Image source={{ uri: djAvatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>
            {(djName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Like */}
      <Pressable
        testID="action-like"
        style={styles.action}
        onPress={() => toggleLike(eventId)}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={30}
          color={liked ? colors.accent : colors.white}
        />
      </Pressable>

      {/* Partager */}
      <Pressable
        testID="action-share"
        style={styles.action}
        onPress={handleShare}
      >
        <Ionicons name="share-social-outline" size={28} color={colors.white} />
      </Pressable>

      {/* Favoris / Bookmark */}
      <Pressable
        testID="action-favorite"
        style={styles.action}
        onPress={() => toggleFavorite(eventId)}
      >
        <Ionicons
          name={favorited ? 'bookmark' : 'bookmark-outline'}
          size={28}
          color={favorited ? colors.accent : colors.white}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 220, // above chat area
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    zIndex: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(124,58,237,0.4)',
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  action: {
    alignItems: 'center',
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/components/live/LiveActionBar.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/live/LiveActionBar.tsx src/__tests__/components/live/LiveActionBar.test.tsx
git commit -m "feat: add LiveActionBar TikTok-style sidebar"
```

---

### Task 9: Integrate LiveActionBar in LivePlayerScreen

**Files:**
- Modify: `src/screens/viewer/LivePlayerScreen.tsx`

**Interfaces:**
- Consumes: `LiveActionBar` (Task 8)
- Produces: updated `LivePlayerScreen` with action bar visible during live

- [ ] **Step 1: Add djName and djAvatarUrl state**

In `LivePlayerScreen`, after the existing `useState` declarations, add:

```tsx
const [djName, setDjName] = useState('');
const [djAvatarUrl] = useState<string | null>(null); // null until LiveEvent gets a djAvatarUrl field
```

- [ ] **Step 2: Extract djName from the event fetch**

Find the `eventsService.getEventById` call (around line 126) and update it:

```tsx
eventsService.getEventById(eventId).then((e) => {
  if (e) {
    setViewCount(e.viewerCount);
    setDjName(e.djName);  // <-- add this line
    if (e.playbackUrl) {
      setPlaybackUrl(e.playbackUrl);
      videoPlayer.replaceAsync({ uri: e.playbackUrl }).then(() => videoPlayer.play());
    }
  }
});
```

- [ ] **Step 3: Add import for LiveActionBar**

At the top of the file, add:

```tsx
import { LiveActionBar } from '../../components/live/LiveActionBar';
```

- [ ] **Step 4: Render LiveActionBar in JSX**

Inside the outer `<View style={styles.container}>`, after the `{/* Top overlay */}` block and before the `{/* Floating emoji overlay */}` block, add:

```tsx
{/* TikTok action bar */}
<LiveActionBar eventId={eventId} djAvatarUrl={djAvatarUrl} djName={djName} />
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Test visually** — open a live in the simulator and verify the 4 icons appear on the right side

- [ ] **Step 7: Commit**

```bash
git add src/screens/viewer/LivePlayerScreen.tsx
git commit -m "feat: integrate LiveActionBar in LivePlayerScreen"
```

---

### Task 10: MesFavorisScreen

**Files:**
- Create: `src/screens/MesFavorisScreen.tsx`
- Test: `src/__tests__/screens/MesFavorisScreen.test.tsx`
- Modify: `src/navigation/MainTabs.tsx` — swap placeholder with real screen

**Interfaces:**
- Consumes: `useFavorites` (Task 5); `eventsService` (existing)
- Produces: `MesFavorisScreen`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/screens/MesFavorisScreen.test.tsx
import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { MesFavorisScreen } from '../../screens/MesFavorisScreen';

jest.mock('../../contexts/FavoritesContext', () => ({
  useFavorites: jest.fn(() => ({
    favoriteIds: new Set(['event-1']),
    isLoading: false,
  })),
}));

jest.mock('../../services', () => ({
  eventsService: {
    getAllEvents: jest.fn().mockResolvedValue([
      {
        id: 'event-1',
        djName: 'DJ Shadow',
        status: 'ended',
        playbackUrl: 'https://stream.example.com/replay',
        genre: 'Techno',
        viewerCount: 42,
      },
    ]),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('MesFavorisScreen', () => {
  it('affiche le titre MES FAVORIS', async () => {
    await act(async () => {
      render(<MesFavorisScreen />);
    });
    expect(screen.getByText('MES FAVORIS')).toBeTruthy();
  });

  it('affiche la rediffusion dans les favoris', async () => {
    await act(async () => {
      render(<MesFavorisScreen />);
    });
    expect(screen.getByText('DJ Shadow')).toBeTruthy();
  });

  it('affiche l\'état vide quand aucun favori', async () => {
    const { useFavorites } = require('../../contexts/FavoritesContext');
    useFavorites.mockReturnValueOnce({ favoriteIds: new Set(), isLoading: false });
    render(<MesFavorisScreen />);
    expect(screen.getByText(/Aucun favori/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/screens/MesFavorisScreen.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Create `src/screens/MesFavorisScreen.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../contexts/FavoritesContext';
import { eventsService } from '../services';
import { LiveEvent } from '../types/event';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

export function MesFavorisScreen() {
  const navigation = useNavigation<any>();
  const { favoriteIds, isLoading } = useFavorites();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (favoriteIds.size === 0) {
      setEvents([]);
      return;
    }
    setLoadingEvents(true);
    eventsService.getAllEvents().then((all) => {
      setEvents(all.filter(e => favoriteIds.has(e.id)));
      setLoadingEvents(false);
    });
  }, [favoriteIds]);

  const liveEvents = events.filter(e => e.status === 'live');
  const replayEvents = events.filter(e => e.status === 'ended' && e.playbackUrl);

  if (isLoading || loadingEvents) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (favoriteIds.size === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="bookmark-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Aucun favori</Text>
        <Text style={styles.emptyText}>Like un live pour le retrouver ici</Text>
      </View>
    );
  }

  const navigateToPlayer = (eventId: string) => {
    // LivePlayer lives inside the Live tab stack — navigate cross-tab
    navigation.navigate('Live' as any, {
      screen: 'LivePlayer',
      params: { eventId },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MES FAVORIS</Text>

      {liveEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>En cours</Text>
          {liveEvents.map(event => (
            <EventCard key={event.id} event={event} onPress={() => navigateToPlayer(event.id)} />
          ))}
        </>
      )}

      {replayEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Rediffusions</Text>
          {replayEvents.map(event => (
            <EventCard key={event.id} event={event} onPress={() => navigateToPlayer(event.id)} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function EventCard({ event, onPress }: { event: LiveEvent; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.thumbnail} />
      <View style={styles.cardInfo}>
        <Text style={styles.djName} numberOfLines={1}>{event.djName}</Text>
        {event.genre && <Text style={styles.genre}>{event.genre}</Text>}
        <View style={styles.viewersRow}>
          <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
          <Text style={styles.viewers}>{event.viewerCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 3,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: 'rgba(124,58,237,0.06)',
    borderColor: 'rgba(124,58,237,0.2)',
  },
  thumbnail: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  djName: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
  genre: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  viewersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewers: {
    color: colors.textMuted,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/screens/MesFavorisScreen.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Wire into MainTabs** — in `src/navigation/MainTabs.tsx`, replace the placeholder for the viewer tab:

At the top, uncomment/add:
```tsx
import { MesFavorisScreen } from '../screens/MesFavorisScreen';
```

Replace:
```tsx
const LiveClubComponent = isDJ
  ? () => <PlaceholderScreen title="Ma discothèque" />
  : () => <PlaceholderScreen title="Mes favoris" />;
```
With:
```tsx
const LiveClubComponent = isDJ
  ? () => <PlaceholderScreen title="Ma discothèque" />  // still placeholder until Task 11
  : MesFavorisScreen;
```

- [ ] **Step 6: Commit**

```bash
git add src/screens/MesFavorisScreen.tsx src/__tests__/screens/MesFavorisScreen.test.tsx src/navigation/MainTabs.tsx
git commit -m "feat: add MesFavorisScreen for viewer tab"
```

---

### Task 11: MaDiscothequeScreen

**Files:**
- Create: `src/screens/MaDiscothequeScreen.tsx`
- Test: `src/__tests__/screens/MaDiscothequeScreen.test.tsx`
- Modify: `src/navigation/MainTabs.tsx` — swap placeholder with real screen

**Interfaces:**
- Consumes: `useAuth` (existing); `eventsService` (existing)
- Produces: `MaDiscothequeScreen`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/screens/MaDiscothequeScreen.test.tsx
import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { MaDiscothequeScreen } from '../../screens/MaDiscothequeScreen';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-dj-1', displayName: 'DJ Shadow' },
    isAuthenticated: true,
  }),
}));

jest.mock('../../services', () => ({
  eventsService: {
    getAllEvents: jest.fn().mockResolvedValue([
      {
        id: 'event-1',
        djName: 'DJ Shadow',
        status: 'ended',
        playbackUrl: 'https://stream.example.com/replay',
        viewerCount: 150,
        scheduledStartTime: '2026-09-20T22:00:00Z',
      },
      {
        id: 'event-2',
        djName: 'DJ Autre',
        status: 'ended',
        playbackUrl: 'https://stream.example.com/replay2',
        viewerCount: 50,
        scheduledStartTime: '2026-09-19T22:00:00Z',
      },
    ]),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('MaDiscothequeScreen', () => {
  it('affiche le titre MA DISCOTHÈQUE', async () => {
    await act(async () => {
      render(<MaDiscothequeScreen />);
    });
    expect(screen.getByText('MA DISCOTHÈQUE')).toBeTruthy();
  });

  it('affiche seulement les sets du DJ connecté', async () => {
    await act(async () => {
      render(<MaDiscothequeScreen />);
    });
    expect(screen.getAllByText('DJ Shadow')).toBeTruthy();
    expect(screen.queryByText('DJ Autre')).toBeNull();
  });

  it('affiche l\'état vide si pas de rediffusions', async () => {
    const { eventsService } = require('../../services');
    eventsService.getAllEvents.mockResolvedValueOnce([]);
    await act(async () => {
      render(<MaDiscothequeScreen />);
    });
    expect(screen.getByText(/Aucune rediffusion/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/screens/MaDiscothequeScreen.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Create `src/screens/MaDiscothequeScreen.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { eventsService } from '../services';
import { LiveEvent } from '../types/event';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';
import { formatEventDate } from '../utils/formatDate';

export function MaDiscothequeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [replays, setReplays] = useState<LiveEvent[] | null>(null);

  useEffect(() => {
    if (!user) return;
    eventsService.getAllEvents().then((all) => {
      // Filter by djName matching displayName — update to djUserId once field exists on LiveEvent
      setReplays(
        all
          .filter(e => e.status === 'ended' && e.djName === user.displayName)
          .sort((a, b) => (b.scheduledStartTime > a.scheduledStartTime ? 1 : -1)),
      );
    });
  }, [user?.id]);

  const navigateToPlayer = (eventId: string) => {
    navigation.navigate('Live' as any, {
      screen: 'LivePlayer',
      params: { eventId },
    });
  };

  if (replays === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (replays.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Aucune rediffusion</Text>
        <Text style={styles.emptyText}>Lance ton premier live !</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MA DISCOTHÈQUE</Text>
      <Text style={styles.subtitle}>{replays.length} set{replays.length > 1 ? 's' : ''} enregistré{replays.length > 1 ? 's' : ''}</Text>

      {replays.map(event => (
        <Pressable
          key={event.id}
          onPress={() => navigateToPlayer(event.id)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={styles.thumbnail} />
          <View style={styles.cardInfo}>
            <Text style={styles.djName} numberOfLines={1}>{event.djName}</Text>
            <Text style={styles.date}>{formatEventDate(event.scheduledStartTime)}</Text>
            {event.genre && <Text style={styles.genre}>{event.genre}</Text>}
            <View style={styles.statsRow}>
              <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
              <Text style={styles.stat}>{event.viewerCount} vues</Text>
            </View>
          </View>
          <Ionicons name="play-circle-outline" size={28} color={colors.textMuted} style={styles.playIcon} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: 'rgba(124,58,237,0.06)',
    borderColor: 'rgba(124,58,237,0.2)',
  },
  thumbnail: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  djName: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
  date: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  genre: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stat: {
    color: colors.textMuted,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
  },
  playIcon: {
    marginRight: spacing.md,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/screens/MaDiscothequeScreen.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Wire into MainTabs** — in `src/navigation/MainTabs.tsx`:

Add import:
```tsx
import { MaDiscothequeScreen } from '../screens/MaDiscothequeScreen';
```

Replace the LiveClubComponent definition:
```tsx
const LiveClubComponent = isDJ ? MaDiscothequeScreen : MesFavorisScreen;
```

Remove `PlaceholderScreen` function and its styles if it's no longer needed anywhere else.

- [ ] **Step 6: Commit**

```bash
git add src/screens/MaDiscothequeScreen.tsx src/__tests__/screens/MaDiscothequeScreen.test.tsx src/navigation/MainTabs.tsx
git commit -m "feat: add MaDiscothequeScreen for DJ tab"
```

---

### Task 12: Wire FavoritesProvider + cleanup

**Files:**
- Modify: `src/navigation/RootNavigator.tsx` — add `FavoritesProvider`
- Delete: `src/screens/LiveClubScreen.tsx`
- Delete: `src/__tests__/screens/LiveClubScreen.test.tsx`

**Interfaces:**
- Consumes: `FavoritesProvider` (Task 5)
- Produces: fully wired system — FavoritesContext available to all screens

- [ ] **Step 1: Update `src/navigation/RootNavigator.tsx`**

Add import:
```tsx
import { FavoritesProvider } from '../contexts/FavoritesContext';
```

Wrap the `NavigationContainer` children so `FavoritesProvider` is inside `NavigationContainer` (needed for navigation hooks inside screens) but wraps `MainTabs`:

```tsx
export function RootNavigator() {
  const { isAuthenticated, isLoading, isGuest } = useAuth();
  const [hasSeenSplash, setHasSeenSplash] = useState<boolean | null>(null);

  useEffect(() => {
    getStoredData<boolean>('@shut_has_seen_splash').then(v => setHasSeenSplash(!!v));
  }, []);

  if (isLoading || hasSeenSplash === null) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated || isGuest ? (
        <FavoritesProvider>
          <MainTabs />
        </FavoritesProvider>
      ) : (
        <AuthStack initialRouteName="SplashLanding" />
      )}
    </NavigationContainer>
  );
}
```

- [ ] **Step 2: Delete LiveClubScreen**

```bash
rm "/Users/nathk/Documents/Professionnel/SHUT Projects/SHUT/shut-app/src/screens/LiveClubScreen.tsx"
rm "/Users/nathk/Documents/Professionnel/SHUT Projects/SHUT/shut-app/src/__tests__/screens/LiveClubScreen.test.tsx"
```

- [ ] **Step 3: Verify no remaining imports of LiveClubScreen**

```bash
grep -r "LiveClubScreen" src/
```
Expected: no results

- [ ] **Step 4: Run all tests**

```bash
npx jest --no-coverage
```
Expected: all tests pass (or only pre-existing failures)

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no new errors

- [ ] **Step 6: Commit**

```bash
git add src/navigation/RootNavigator.tsx
git rm src/screens/LiveClubScreen.tsx src/__tests__/screens/LiveClubScreen.test.tsx
git commit -m "feat: wire FavoritesProvider, remove LiveClubScreen"
```
