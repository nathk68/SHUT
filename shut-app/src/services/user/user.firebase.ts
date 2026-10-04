import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) =>
        v !== null && typeof v === 'object' && !Array.isArray(v)
          ? [k, stripUndefined(v as Record<string, unknown>)]
          : [k, v]
      )
  );
}
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase.config';
import type { User } from '../../types/user';
import type { UpdateProfilePayload } from '../../types/profile';
import type { IUserService } from './user.service';

export class FirebaseUserService implements IUserService {
  async getUserById(userId: string): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as User;
  }

  async getDJs(): Promise<User[]> {
    const q = query(collection(db, 'users'), where('role', '==', 'broadcaster'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
  }

  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<User> {
    const ref_ = doc(db, 'users', userId);
    await updateDoc(ref_, stripUndefined(payload) as Record<string, unknown>);
    const snap = await getDoc(ref_);
    if (!snap.exists()) throw new Error(`User ${userId} not found`);
    return { id: snap.id, ...snap.data() } as User;
  }

  async uploadAvatar(userId: string, localUri: string): Promise<string> {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `avatars/${userId}.jpg`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  }
}
