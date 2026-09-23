import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  runTransaction,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import type { IFollowService } from './follow.service';

export class FirebaseFollowService implements IFollowService {
  private col = collection(db, 'userFollows');

  async follow(followerId: string, followeeId: string): Promise<void> {
    const existing = await getDocs(
      query(this.col, where('followerId', '==', followerId), where('followeeId', '==', followeeId))
    );
    if (!existing.empty) return;

    await runTransaction(db, async (tx) => {
      const followerRef = doc(db, 'users', followerId);
      const followeeRef = doc(db, 'users', followeeId);
      const [followerSnap, followeeSnap] = await Promise.all([tx.get(followerRef), tx.get(followeeRef)]);
      tx.update(followerRef, { followingCount: (followerSnap.data()?.followingCount ?? 0) + 1 });
      tx.update(followeeRef, { followersCount: (followeeSnap.data()?.followersCount ?? 0) + 1 });
    });

    await addDoc(this.col, { followerId, followeeId, followedAt: serverTimestamp() });
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    const snap = await getDocs(
      query(this.col, where('followerId', '==', followerId), where('followeeId', '==', followeeId))
    );
    if (snap.empty) return;

    await runTransaction(db, async (tx) => {
      const followerRef = doc(db, 'users', followerId);
      const followeeRef = doc(db, 'users', followeeId);
      const [followerSnap, followeeSnap] = await Promise.all([tx.get(followerRef), tx.get(followeeRef)]);
      tx.update(followerRef, { followingCount: Math.max(0, (followerSnap.data()?.followingCount ?? 1) - 1) });
      tx.update(followeeRef, { followersCount: Math.max(0, (followeeSnap.data()?.followersCount ?? 1) - 1) });
    });

    for (const d of snap.docs) await deleteDoc(d.ref);
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const snap = await getDocs(
      query(this.col, where('followerId', '==', followerId), where('followeeId', '==', followeeId))
    );
    return !snap.empty;
  }

  async getFollowing(userId: string): Promise<string[]> {
    const snap = await getDocs(query(this.col, where('followerId', '==', userId)));
    return snap.docs.map((d) => d.data().followeeId as string);
  }

  async getFollowers(userId: string): Promise<string[]> {
    const snap = await getDocs(query(this.col, where('followeeId', '==', userId)));
    return snap.docs.map((d) => d.data().followerId as string);
  }
}
