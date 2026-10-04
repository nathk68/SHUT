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
import { IFavoritesService } from './favorites.service';

export class FirebaseFavoritesService implements IFavoritesService {
  async getFavorites(userId: string): Promise<string[]> {
    const q = query(
      collection(db, 'userFavorites'),
      where('userId', '==', userId),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().eventId as string);
  }

  async addFavorite(userId: string, eventId: string): Promise<void> {
    const exists = await this.isFavorite(userId, eventId);
    if (exists) return;
    await addDoc(collection(db, 'userFavorites'), {
      userId,
      eventId,
      addedAt: new Date().toISOString(),
    });
  }

  async removeFavorite(userId: string, eventId: string): Promise<void> {
    const q = query(
      collection(db, 'userFavorites'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
    );
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'userFavorites', d.id))));
  }

  async isFavorite(userId: string, eventId: string): Promise<boolean> {
    const q = query(
      collection(db, 'userFavorites'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }

  async getFavoritesCountForItem(eventId: string): Promise<number> {
    const q = query(
      collection(db, 'userFavorites'),
      where('eventId', '==', eventId),
    );
    const snap = await getDocs(q);
    return snap.size;
  }
}
