import { useCallback, useEffect, useRef, useState } from 'react';
import {
  normalizeUsername,
  validateUsernameFormat,
  isUsernameAvailable,
} from '../services/username/username.service';

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function useUsernameCheck(currentUsername?: string) {
  const [username, setUsername] = useState(currentUsername ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((value: string) => {
    // Only allow valid characters while typing (lowercase + digits + . + _)
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setUsername(cleaned);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!username) {
      setStatus('idle');
      setError(null);
      return;
    }

    const formatError = validateUsernameFormat(username);
    if (formatError) {
      setStatus('invalid');
      setError(formatError);
      return;
    }

    // If the username is the same as the current one (for edit), it's available
    if (currentUsername && normalizeUsername(username) === normalizeUsername(currentUsername)) {
      setStatus('available');
      setError(null);
      return;
    }

    setStatus('checking');
    setError(null);

    timerRef.current = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(username);
        setStatus(available ? 'available' : 'taken');
        setError(available ? null : 'Ce pseudo est déjà pris');
      } catch {
        // Firestore rules may block reads on `usernames` collection.
        // Fall back to "available" — the real guard is the atomic reserveUsername transaction.
        setStatus('available');
        setError(null);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [username, currentUsername]);

  return { username, setUsername: handleChange, status, error };
}
