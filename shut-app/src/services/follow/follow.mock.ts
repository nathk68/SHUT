import type { IFollowService } from './follow.service';

export class MockFollowService implements IFollowService {
  private follows: Set<string> = new Set();

  private key(followerId: string, followeeId: string): string {
    return `${followerId}:${followeeId}`;
  }

  async follow(followerId: string, followeeId: string): Promise<void> {
    this.follows.add(this.key(followerId, followeeId));
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    this.follows.delete(this.key(followerId, followeeId));
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    return this.follows.has(this.key(followerId, followeeId));
  }

  async getFollowing(userId: string): Promise<string[]> {
    const result: string[] = [];
    for (const key of this.follows) {
      const [ferId, feeId] = key.split(':');
      if (ferId === userId) result.push(feeId);
    }
    return result;
  }

  async getFollowers(userId: string): Promise<string[]> {
    const result: string[] = [];
    for (const key of this.follows) {
      const [ferId, feeId] = key.split(':');
      if (feeId === userId) result.push(ferId);
    }
    return result;
  }
}
