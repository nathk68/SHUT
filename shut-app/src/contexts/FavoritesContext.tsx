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

interface IdsState {
  favoriteIds: Set<string>;
  likedIds: Set<string>;
  isLoading: boolean;
}

const EMPTY_STATE: IdsState = {
  favoriteIds: new Set<string>(),
  likedIds: new Set<string>(),
  isLoading: false,
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<IdsState>(EMPTY_STATE);

  useEffect(() => {
    if (!user) {
      setState(EMPTY_STATE);
      return;
    }
    setState(prev => ({ ...prev, isLoading: true }));
    Promise.all([
      favoritesService.getFavorites(user.id),
      likesService.getLikes(user.id),
    ])
      .then(([favs, likes]) => {
        setState({
          favoriteIds: new Set(favs),
          likedIds: new Set(likes),
          isLoading: false,
        });
      })
      .catch(() => {
        setState(prev => ({ ...prev, isLoading: false }));
      });
  }, [user?.id]);

  const toggleFavorite = useCallback(
    async (eventId: string) => {
      if (!user) return;
      const wasFav = state.favoriteIds.has(eventId);
      // Optimistic update
      setState(prev => {
        const next = new Set(prev.favoriteIds);
        if (wasFav) next.delete(eventId); else next.add(eventId);
        return { ...prev, favoriteIds: next };
      });
      // Backend sync with rollback
      try {
        if (wasFav) {
          await favoritesService.removeFavorite(user.id, eventId);
        } else {
          await favoritesService.addFavorite(user.id, eventId);
        }
      } catch {
        // Rollback on failure
        setState(prev => {
          const next = new Set(prev.favoriteIds);
          if (wasFav) next.add(eventId); else next.delete(eventId);
          return { ...prev, favoriteIds: next };
        });
      }
    },
    [user, state.favoriteIds],
  );

  const toggleLike = useCallback(
    async (eventId: string) => {
      if (!user) return;
      const wasLiked = state.likedIds.has(eventId);
      // Optimistic update
      setState(prev => {
        const next = new Set(prev.likedIds);
        if (wasLiked) next.delete(eventId); else next.add(eventId);
        return { ...prev, likedIds: next };
      });
      // Backend sync with rollback
      try {
        await likesService.toggleLike(user.id, eventId);
      } catch {
        // Rollback on failure
        setState(prev => {
          const next = new Set(prev.likedIds);
          if (wasLiked) next.add(eventId); else next.delete(eventId);
          return { ...prev, likedIds: next };
        });
      }
    },
    [user, state.likedIds],
  );

  const isFavorite = useCallback(
    (eventId: string) => state.favoriteIds.has(eventId),
    [state.favoriteIds],
  );

  const isLiked = useCallback(
    (eventId: string) => state.likedIds.has(eventId),
    [state.likedIds],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds: state.favoriteIds,
        likedIds: state.likedIds,
        toggleFavorite,
        toggleLike,
        isFavorite,
        isLiked,
        isLoading: state.isLoading,
      }}
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
