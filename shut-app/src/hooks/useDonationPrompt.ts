import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_SESSIONS = 'donation_app_sessions';
const MIN_SESSIONS = 1;

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
      const sessionsStr = await AsyncStorage.getItem(KEY_SESSIONS);
      const sessions = sessionsStr ? parseInt(sessionsStr, 10) : 0;
      return sessions >= MIN_SESSIONS;
    } catch {
      return false;
    }
  }

  async function markPrompted(): Promise<void> {
    // no-op — kept for API compatibility
  }

  return { shouldPrompt, markPrompted };
}
