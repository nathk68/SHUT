import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LAST_PROMPT = 'donation_last_prompt_date';
const KEY_SESSIONS = 'donation_app_sessions';
const MIN_SESSIONS = 3;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

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
      const [sessionsStr, lastPromptDate] = await Promise.all([
        AsyncStorage.getItem(KEY_SESSIONS),
        AsyncStorage.getItem(KEY_LAST_PROMPT),
      ]);

      const sessions = sessionsStr ? parseInt(sessionsStr, 10) : 0;
      if (sessions < MIN_SESSIONS) return false;

      if (lastPromptDate === todayISO()) return false;

      return true;
    } catch {
      return false;
    }
  }

  async function markPrompted(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_LAST_PROMPT, todayISO());
    } catch {
      // silent
    }
  }

  return { shouldPrompt, markPrompted };
}
