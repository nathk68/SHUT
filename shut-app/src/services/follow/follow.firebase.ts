import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
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

    // Only update current user's followingCount (own doc → allowed by rules).
    // The followee's followersCount should be maintained by a Cloud Function
    // or computed from the userFollows collection on read.
    const followerRef = doc(db, 'users', followerId);
    const followerSnap = await getDocs(query(this.col, where('followerId', '==', followerId)));
    const newFollowingCount = followerSnap.size + 1;

    await addDoc(this.col, { followerId, followeeId, followedAt: serverTimestamp() });
    // Best-effort update of own counter
    try {
      await updateDoc(followerRef, { followingCount: newFollowingCount });
    } catch { /* counter update failed, not critical */ }
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    const snap = await getDocs(
      query(this.col, where('followerId', '==', followerId), where('followeeId', '==', followeeId))
    );
    if (snap.empty) return;

    for (const d of snap.docs) await deleteDoc(d.ref);

    // Best-effort update of own counter
    try {
      const followerRef = doc(db, 'users', followerId);
      const remaining = await getDocs(query(this.col, where('followerId', '==', followerId)));
      await updateDoc(followerRef, { followingCount: remaining.size });
    } catch { /* counter update failed, not critical */ }
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

  async getNotificationsEnabled(followerId: string, followeeId: string): Promise<boolean> {
    const snap = await getDocs(
      query(this.col, where('followerId', '==', followerId), where('followeeId', '==', followeeId))
    );
    if (snap.empty) return false;
    return snap.docs[0].data().notificationsEnabled === true;
  }

  async setNotificationsEnabled(followerId: string, followeeId: string, enabled: boolean): Promise<void> {
    const snap = await getDocs(
      query(this.col, where('followerId', '==', followerId), where('followeeId', '==', followeeId))
    );
    if (snap.empty) return;
    await updateDoc(snap.docs[0].ref, { notificationsEnabled: enabled });
  }
}
