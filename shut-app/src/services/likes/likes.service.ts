export interface ILikesService {
  getLikes(userId: string): Promise<string[]>;
  toggleLike(userId: string, eventId: string): Promise<boolean>; // returns new liked state
  isLiked(userId: string, eventId: string): Promise<boolean>;
  /** Count total likes received across a set of content IDs (events/replays) */
  getLikesCountForItems(itemIds: string[]): Promise<number>;
}
