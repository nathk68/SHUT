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
