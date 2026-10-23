# Design — Refonte onglets + Système de favoris
Date : 2026-09-22
Branche : dev

---

## Contexte

Refonte majeure de la navigation principale et introduction d'un système de favoris/likes persisté en Firebase.

---

## 1. Navigation & Onglets

### Renames

| Route | Label actuel | Nouveau label | Icône |
|-------|-------------|---------------|-------|
| ShutDiffusion | Diffusion | Explorer | `compass-outline` |
| Live | Live | En direct | `videocam-outline` |
| GoLive | DJ Live | DJ Live | `radio-outline` (inchangé) |
| LiveClub | Live Club | Mes favoris (viewer) / Ma discothèque (DJ) | `heart-outline` / `musical-notes-outline` |
| Parametres | Paramètres | Profil | `TabAvatar` dynamique |

### Onglet Profil — icône dynamique

Nouveau composant `TabAvatar` (src/components/ui/TabAvatar.tsx) :
- Si `user.avatarUrl` : `Image` circulaire 24×24, bordure violette si onglet actif
- Sinon : `View` circulaire 24×24 fond violet semi-transparent, initiale du `username` ou `displayName` en blanc
- Si guest : `person-outline` classique

### Onglet 4 — contenu selon rôle

- `currentRole === 'viewer'` → `MesFavorisScreen`
- `currentRole === 'broadcaster'` → `MaDiscothèqueScreen`

`LiveClubScreen.tsx` est supprimé.

---

## 2. Modèle de données

### Nouveaux types (src/types/favorite.ts)

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
  likedAt: string;
}
```

### Collections Firestore

```
/userFavorites/{docId}  — userId, eventId, addedAt
/userLikes/{docId}      — userId, eventId, likedAt
```

Index : `(userId, eventId)` pour unicité et lookup rapide ; `userId` pour lister.

### Rediffusion

Pas de nouveau type. Une rediffusion = `LiveEvent` avec `status: 'ended'` et `playbackUrl` non null.

---

## 3. Services

### favoritesService (src/services/favorites/)

```ts
interface FavoritesService {
  getFavorites(userId: string): Promise<string[]>
  addFavorite(userId: string, eventId: string): Promise<void>
  removeFavorite(userId: string, eventId: string): Promise<void>
  isFavorite(userId: string, eventId: string): Promise<boolean>
}
```

Fichiers :
- `favorites.service.ts` — interface + factory (USE_MOCK)
- `favorites.firebase.ts` — implémentation Firestore
- `favorites.mock.ts` — implémentation en mémoire

### likesService (src/services/likes/)

```ts
interface LikesService {
  getLikes(userId: string): Promise<string[]>
  toggleLike(userId: string, eventId: string): Promise<boolean> // retourne nouvel état
  isLiked(userId: string, eventId: string): Promise<boolean>
}
```

Fichiers :
- `likes.service.ts`
- `likes.firebase.ts`
- `likes.mock.ts`

`src/services/index.ts` exporte `favoritesService` et `likesService`.

---

## 4. FavoritesContext

**src/contexts/FavoritesContext.tsx**

```ts
interface FavoritesContextType {
  favoriteIds: Set<string>
  likedIds: Set<string>
  toggleFavorite: (eventId: string) => Promise<void>
  toggleLike: (eventId: string) => Promise<void>
  isFavorite: (eventId: string) => boolean
  isLiked: (eventId: string) => boolean
  isLoading: boolean
}
```

Comportement :
- Charge `getFavorites` + `getLikes` au mount si user connecté
- Updates optimistes : Set mis à jour immédiatement, Firebase en arrière-plan
- Guest : Sets vides, toggles affichent un prompt "Connecte-toi pour sauvegarder"
- Placé dans le provider tree de RootNavigator, après AuthProvider

---

## 5. LiveActionBar (TikTok sidebar)

**src/components/live/LiveActionBar.tsx**

Positionné en absolu, côté droit du player, centré verticalement.

Props :
```ts
interface LiveActionBarProps {
  eventId: string;
  djAvatarUrl: string | null;
  djName: string;
}
```

Éléments (de haut en bas) :
1. **Avatar DJ** — `Image` circulaire ou initiale, non interactif pour l'instant
2. **Like** — `heart-outline` blanc → `heart` violet. Appelle `toggleLike`. Affiche compteur sous l'icône.
3. **Partager** — `share-social-outline`. Appelle `Share.share()` natif avec lien/nom du DJ.
4. **Favoris** — `bookmark-outline` blanc → `bookmark` violet. Appelle `toggleFavorite`.

Le composant consomme `FavoritesContext` directement.

Intégré dans `LivePlayerScreen` en position `absolute` right.

---

## 6. Nouveaux écrans

### MesFavorisScreen (src/screens/MesFavorisScreen.tsx)

- Rôle : viewer
- Charge les `favoriteIds` depuis `FavoritesContext`, fetch les events via `eventsService`
- Deux sections : **En cours** (status: 'live') et **Rediffusions** (status: 'ended')
- Carte : thumbnail, nom DJ, genre, durée. Tap → `LivePlayer`
- État vide : icône bookmark + "Aucun favori — like un live pour le retrouver ici"

### MaDiscothèqueScreen (src/screens/MaDiscothèqueScreen.tsx)

- Rôle : broadcaster (DJ)
- Charge les `LiveEvent` du DJ connecté avec `status: 'ended'`
- Filtrage par `userId` du DJ (ou `displayName` en attendant un champ `djUserId` sur LiveEvent)
- Carte : date, titre, durée, nombre de vues
- État vide : "Aucune rediffusion — lance ton premier live !"

---

## 7. TabAvatar

**src/components/ui/TabAvatar.tsx**

Props :
```ts
interface TabAvatarProps {
  size: number;
  color: string; // tint color du tab navigator (actif/inactif)
  avatarUrl: string | null;
  displayName: string;
  focused: boolean;
}
```

Rendu :
- `avatarUrl` non null → `Image` circulaire, bordure `color` si focused
- Sinon → `View` circulaire, fond `rgba(124,58,237,0.3)`, initiale en `color`
- Guest → `Ionicons person-outline`

---

## Fichiers touchés

### Nouveaux
- `src/types/favorite.ts`
- `src/services/favorites/favorites.service.ts`
- `src/services/favorites/favorites.firebase.ts`
- `src/services/favorites/favorites.mock.ts`
- `src/services/likes/likes.service.ts`
- `src/services/likes/likes.firebase.ts`
- `src/services/likes/likes.mock.ts`
- `src/contexts/FavoritesContext.tsx`
- `src/components/ui/TabAvatar.tsx`
- `src/components/live/LiveActionBar.tsx`
- `src/screens/MesFavorisScreen.tsx`
- `src/screens/MaDiscothèqueScreen.tsx`

### Modifiés
- `src/navigation/MainTabs.tsx` — renames, TabAvatar, rôle-based tab 4
- `src/navigation/RootNavigator.tsx` — ajout FavoritesProvider
- `src/screens/viewer/LivePlayerScreen.tsx` — intégration LiveActionBar
- `src/services/index.ts` — exports favoritesService, likesService
- `src/types/index.ts` — export UserFavorite, UserLike

### Supprimés
- `src/screens/LiveClubScreen.tsx`
- `src/__tests__/screens/LiveClubScreen.test.tsx`
