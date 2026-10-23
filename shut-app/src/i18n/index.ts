import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

import fr from './locales/fr.json';
import en from './locales/en.json';

const STORAGE_KEY = '@shut_preferences';

function getDeviceLanguage(): 'fr' | 'en' {
  // Only attempt expo-localization if its native module is linked
  if (NativeModules.ExpoLocalization) {
    try {
      const { getLocales } = require('expo-localization');
      const code = getLocales()[0]?.languageCode;
      if (code?.startsWith('fr')) return 'fr';
      return 'en';
    } catch {}
  }

  // Fallback: read from native modules directly
  if (Platform.OS === 'ios') {
    const settings = NativeModules.SettingsManager?.settings;
    const locale = settings?.AppleLocale ?? settings?.AppleLanguages?.[0];
    if (locale?.startsWith('fr')) return 'fr';
  }

  if (Platform.OS === 'android') {
    const locale = NativeModules.I18nManager?.localeIdentifier;
    if (locale?.startsWith('fr')) return 'fr';
  }

  return 'en';
}

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        if (prefs.language) {
          callback(prefs.language);
          return;
        }
      }
    } catch {}
    callback(getDeviceLanguage());
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
