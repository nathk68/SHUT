import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { IReplaysService } from './replays.service';
import { Replay } from '../../types';

const COLLECTION = 'replays';

export class FirebaseReplaysService implements IReplaysService {

  async getPublishedReplays(): Promise<Replay[]> {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Replay));
  }

  async getReplaysByUser(userId: string): Promise<Replay[]> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Replay));
  }

  async getPublishedReplaysByUser(userId: string): Promise<Replay[]> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Replay));
  }

  async getDraftReplaysByUser(userId: string): Promise<Replay[]> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('status', 'in', ['draft', 'processing']),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Replay));
  }

  async getReplayById(id: string): Promise<Replay | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Replay;
  }

  async getReplayByEventId(eventId: string): Promise<Replay | null> {
    const q = query(
      collection(db, COLLECTION),
      where('eventId', '==', eventId),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Replay;
  }

  onReplayChange(id: string, callback: (replay: Replay | null) => void): () => void {
    return onSnapshot(doc(db, COLLECTION, id), (snap) => {
      callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Replay) : null);
    });
  }

  onReplayByEventId(eventId: string, callback: (replay: Replay | null) => void): () => void {
    const q = query(
      collection(db, COLLECTION),
      where('eventId', '==', eventId),
      limit(1),
    );
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        callback(null);
      } else {
        const d = snap.docs[0];
        callback({ id: d.id, ...d.data() } as Replay);
      }
    });
  }

  async updateReplay(
    id: string,
    updates: Partial<Pick<Replay, 'title' | 'genres' | 'status' | 'publishedAt' | 'trimStart' | 'trimEnd' | 'location' | 'liveDate' | 'duration'>>,
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), updates);
  }
}
