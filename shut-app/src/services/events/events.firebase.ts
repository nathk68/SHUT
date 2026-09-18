import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { IEventsService } from './events.service';
import { LiveEvent } from '../../types';
import { EventStatus } from '../../config/constants';

const COLLECTION = 'events';

export class FirebaseEventsService implements IEventsService {

  async getUpcomingEvents(): Promise<LiveEvent[]> {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'scheduled'),
      where('scheduledStartTime', '>', new Date().toISOString()),
      orderBy('scheduledStartTime', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LiveEvent));
  }

  async getLiveEvents(): Promise<LiveEvent[]> {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'live')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LiveEvent));
  }

  async getAllEvents(): Promise<LiveEvent[]> {
    const q = query(
      collection(db, COLLECTION),
      orderBy('scheduledStartTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LiveEvent));
  }

  async getEventById(id: string): Promise<LiveEvent | null> {
    const docSnap = await getDoc(doc(db, COLLECTION, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as LiveEvent;
  }

  async getEventsByFestival(festivalId: string): Promise<LiveEvent[]> {
    const q = query(
      collection(db, COLLECTION),
      where('festivalId', '==', festivalId),
      orderBy('scheduledStartTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LiveEvent));
  }

  async createEvent(event: Omit<LiveEvent, 'id' | 'createdAt'>): Promise<LiveEvent> {
    const data = { ...event, createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return { id: docRef.id, ...data } as LiveEvent;
  }

  async updateEvent(id: string, updates: Partial<LiveEvent>): Promise<LiveEvent> {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, updates);
    const updated = await getDoc(ref);
    return { id: updated.id, ...updated.data() } as LiveEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  async setEventStatus(id: string, status: EventStatus): Promise<LiveEvent> {
    const updates: Partial<LiveEvent> = { status };
    if (status === 'live') updates.actualStartTime = new Date().toISOString();
    else if (status === 'ended') updates.actualEndTime = new Date().toISOString();
    return this.updateEvent(id, updates);
  }

  async incrementViewerCount(id: string, delta: 1 | -1): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      viewerCount: increment(delta),
    });
  }

  onEventsChange(callback: (events: LiveEvent[]) => void): () => void {
    const q = query(collection(db, COLLECTION), orderBy('scheduledStartTime', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LiveEvent));
      callback(events);
    });
  }
}
