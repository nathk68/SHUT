export interface ILikesService {
  getLikes(userId: string): Promise<string[]>;
  toggleLike(userId: string, eventId: string): Promise<boolean>; // returns new liked state
  isLiked(userId: string, eventId: string): Promise<boolean>;
}
