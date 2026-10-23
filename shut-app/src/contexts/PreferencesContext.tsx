import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import i18n from '../i18n';
import { db } from '../config/firebase.config';

export type Language = 'fr' | 'en';
export type VideoQuality = 'auto' | '720p' | '480p' | '360p';

export interface NotificationPrefs {
  lives: boolean;
  follows: boolean;
  news: boolean;
}

interface Preferences {
  language: Language;
  videoQuality: VideoQuality;
  notifications: NotificationPrefs;
  recordLives: boolean;
}

interface PreferencesContextType extends Preferences {
  /** Set the current user ID so language changes are synced to Firestore */
  setUserId: (uid: string | null) => void;
  setLanguage: (lang: Language) => Promise<void>;
  setVideoQuality: (quality: VideoQuality) => Promise<void>;
  setNotificationPref: (key: keyof NotificationPrefs, value: boolean) => Promise<void>;
  setRecordLives: (value: boolean) => Promise<void>;
}

const DEFAULT_PREFS: Preferences = {
  language: 'fr',
  videoQuality: 'auto',
  notifications: { lives: true, follows: true, news: false },
  recordLives: false,
};

const STORAGE_KEY = '@shut_preferences';
const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); } catch {}
      } else {
        // No saved prefs — sync language with what i18n detected (device language)
        const detected = (i18n.language ?? 'fr') as Language;
        setPrefs(prev => ({ ...prev, language: detected }));
      }
    });
  }, []);

  // When a user logs in, sync their current language to Firestore for emails
  useEffect(() => {
    if (userId) {
      setDoc(doc(db, 'users', userId), { language: prefs.language }, { merge: true }).catch(() => {});
    }
  }, [userId]); // only on userId change, not on every prefs change

  const save = useCallback(async (updated: Preferences) => {
    setPrefs(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setLanguage = useCallback(
    async (language: Language) => {
      i18n.changeLanguage(language);
      // Sync to Firestore so emails use the right language
      if (userId) {
        setDoc(doc(db, 'users', userId), { language }, { merge: true }).catch(() => {});
      }
      return save({ ...prefs, language });
    },
    [prefs, save, userId],
  );
  const setVideoQuality = useCallback(
    async (videoQuality: VideoQuality) => save({ ...prefs, videoQuality }),
    [prefs, save],
  );
  const setNotificationPref = useCallback(
    async (key: keyof NotificationPrefs, value: boolean) =>
      save({ ...prefs, notifications: { ...prefs.notifications, [key]: value } }),
    [prefs, save],
  );
  const setRecordLives = useCallback(
    async (value: boolean) => save({ ...prefs, recordLives: value }),
    [prefs, save],
  );

  return (
    <PreferencesContext.Provider
      value={{ ...prefs, setUserId, setLanguage, setVideoQuality, setNotificationPref, setRecordLives }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
