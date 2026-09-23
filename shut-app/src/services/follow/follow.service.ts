export interface IFollowService {
  follow(followerId: string, followeeId: string): Promise<void>;
  unfollow(followerId: string, followeeId: string): Promise<void>;
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
  getFollowing(userId: string): Promise<string[]>;
  getFollowers(userId: string): Promise<string[]>;
}
