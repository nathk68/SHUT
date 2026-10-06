import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); } catch {}
      }
    });
  }, []);

  const save = useCallback(async (updated: Preferences) => {
    setPrefs(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setLanguage = useCallback(
    async (language: Language) => {
      i18n.changeLanguage(language);
      return save({ ...prefs, language });
    },
    [prefs, save],
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
      value={{ ...prefs, setLanguage, setVideoQuality, setNotificationPref, setRecordLives }}
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
