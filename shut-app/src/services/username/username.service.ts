import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

const USERNAME_REGEX = /^[a-z0-9._]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.toLowerCase().replace(/\s/g, '');
}

export function validateUsernameFormat(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (normalized.length < 3) return 'Minimum 3 caractères';
  if (normalized.length > 20) return 'Maximum 20 caractères';
  if (!USERNAME_REGEX.test(normalized))
    return 'Lettres minuscules, chiffres, points et underscores uniquement';
  if (normalized.startsWith('.') || normalized.endsWith('.'))
    return 'Ne peut pas commencer ou finir par un point';
  if (normalized.includes('..'))
    return 'Pas de points consécutifs';
  return null;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const snap = await getDoc(doc(db, 'usernames', normalized));
  return !snap.exists();
}

/**
 * Reserve a username atomically via Firestore transaction.
 * Creates a document in `usernames/{normalized}` with the uid.
 * Throws if already taken.
 */
export async function reserveUsername(username: string, uid: string): Promise<void> {
  const normalized = normalizeUsername(username);
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'usernames', normalized);
    const snap = await tx.get(ref);
    if (snap.exists()) {
      throw new Error('Ce pseudo est déjà pris');
    }
    tx.set(ref, { uid, createdAt: new Date().toISOString() });
  });
}

/**
 * Release a previously reserved username.
 */
export async function releaseUsername(username: string): Promise<void> {
  const normalized = normalizeUsername(username);
  const { deleteDoc: delDoc } = await import('firebase/firestore');
  await delDoc(doc(db, 'usernames', normalized));
}

/**
 * Change username: release old, reserve new (atomic for the new one).
 */
export async function changeUsername(
  oldUsername: string,
  newUsername: string,
  uid: string,
): Promise<void> {
  await reserveUsername(newUsername, uid);
  try {
    await releaseUsername(oldUsername);
  } catch {
    // Old username cleanup is best-effort
  }
}
