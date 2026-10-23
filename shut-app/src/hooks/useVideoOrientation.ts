import { useEffect, useRef, useState, useCallback } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import type { VideoPlayer } from 'expo-video';

/**
 * Detects whether the video stream is landscape (width > height) via the
 * `sourceLoad` event and manages:
 *  - a "rotate your phone" overlay (shown for ~2 s)
 *  - programmatic screen orientation lock (landscape ↔ portrait)
 *  - cleanup on unmount (always restores portrait)
 *
 * Also handles mid-stream orientation changes (e.g. DJ switches camera).
 */
export function useVideoOrientation(player: VideoPlayer) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [showRotateOverlay, setShowRotateOverlay] = useState(false);
  const [orientationReady, setOrientationReady] = useState(false);
  const isLandscapeRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Immediately restore portrait orientation and clear pending timers. */
  const lockPortrait = useCallback(async () => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setShowRotateOverlay(false);
    if (isLandscapeRef.current) {
      isLandscapeRef.current = false;
      setIsLandscape(false);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      // Small delay so the rotation animation completes before the caller navigates away
      await new Promise<void>((r) => setTimeout(r, 150));
    }
  }, []);

  useEffect(() => {
    const sub = player.addListener('sourceLoad', (payload: any) => {
      const tracks = payload.availableVideoTracks;
      if (!tracks || tracks.length === 0) return;

      setOrientationReady(true);
      const { width, height } = tracks[0].size;
      const landscape = width > height;

      if (landscape && !isLandscapeRef.current) {
        // ── Transition to landscape ───────────────────────────────
        isLandscapeRef.current = true;
        setIsLandscape(true);
        setShowRotateOverlay(true);

        // Lock to landscape after the overlay animation plays (1.5 s)
        lockTimerRef.current = setTimeout(() => {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }, 1500);

        // Dismiss overlay after the physical rotation is complete (~2.2 s)
        dismissTimerRef.current = setTimeout(() => {
          setShowRotateOverlay(false);
        }, 2200);
      } else if (!landscape && isLandscapeRef.current) {
        // ── Transition back to portrait ───────────────────────────
        isLandscapeRef.current = false;
        setIsLandscape(false);
        if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        setShowRotateOverlay(false);
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    });

    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      sub.remove();
      // Always restore portrait when the player screen unmounts
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [player]);

  return { isLandscape, showRotateOverlay, lockPortrait, orientationReady };
}
