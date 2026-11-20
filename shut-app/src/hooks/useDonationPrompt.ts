import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_SESSIONS = 'donation_app_sessions';
const KEY_LAST_DONATION = 'donation_last_donated_at';
const MIN_SESSIONS = 1;
const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export function useDonationPrompt() {
  const incrementedRef = useRef(false);

  // Increment session counter once on mount
  useEffect(() => {
    if (incrementedRef.current) return;
    incrementedRef.current = true;

    AsyncStorage.getItem(KEY_SESSIONS)
      .then((val) => {
        const count = val ? parseInt(val, 10) : 0;
        return AsyncStorage.setItem(KEY_SESSIONS, String(count + 1));
      })
      .catch(() => {});
  }, []);

  async function shouldPrompt(): Promise<boolean> {
    try {
      const [sessionsStr, lastDonatedStr] = await Promise.all([
        AsyncStorage.getItem(KEY_SESSIONS),
        AsyncStorage.getItem(KEY_LAST_DONATION),
      ]);
      const sessions = sessionsStr ? parseInt(sessionsStr, 10) : 0;
      if (sessions < MIN_SESSIONS) return false;

      if (lastDonatedStr) {
        const elapsed = Date.now() - parseInt(lastDonatedStr, 10);
        if (elapsed < COOLDOWN_MS) return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async function markDonated(): Promise<void> {
    await AsyncStorage.setItem(KEY_LAST_DONATION, String(Date.now()));
  }

  return { shouldPrompt, markDonated };
}
