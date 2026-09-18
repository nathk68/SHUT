import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase.config';
import { IAuthService } from './auth.service';
import { User } from '../../types';
import { UserRole } from '../../config/constants';

export class FirebaseAuthService implements IAuthService {

  async login(email: string, password: string) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = await this.getUserProfile(credential.user.uid);
      if (!user) {
        return { success: false, error: 'Profil utilisateur introuvable' };
      }
      return { success: true, user };
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'Aucun compte avec cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/invalid-email': 'Email invalide',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
      };
      return {
        success: false,
        error: errorMessages[error.code] || 'Erreur de connexion',
      };
    }
  }

  async register(email: string, password: string, displayName: string, role: UserRole) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });

      const user: User = {
        id: credential.user.uid,
        email,
        displayName,
        avatarUrl: null,
        role,
        festivalId: null,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', credential.user.uid), user);
      return { success: true, user };
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé',
        'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
        'auth/invalid-email': 'Email invalide',
      };
      return {
        success: false,
        error: errorMessages[error.code] || "Erreur lors de l'inscription",
      };
    }
  }

  async logout() {
    await signOut(auth);
  }

  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    return this.getUserProfile(firebaseUser.uid);
  }

  private async getUserProfile(uid: string): Promise<User | null> {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) return null;
    return docSnap.data() as User;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const user = await this.getUserProfile(firebaseUser.uid);
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}
