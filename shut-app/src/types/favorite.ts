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
