import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { eventsService, streamingService } from '../../services';
import { usePreferences } from '../../contexts/PreferencesContext';

// ─── NodePublisher (RTMP streaming only, loaded dynamically) ──────────────────

let NodePublisher: any = null;
try {
  ({ NodePublisher } = require('react-native-nodemediaclient'));
} catch {}

// Static params — module-level to avoid re-creating on every render,
// which would cause NodePublisher to re-init its AVCaptureSession.
const AUDIO_PARAM = { codecid: 86018, profile: 1, samplerate: 44100, channels: 2, bitrate: 96000 };
// profile 0 = AUTO — lets the SDK pick the best profile.
// With HWAccelEnable=true, iOS VideoToolbox handles encoding (not x264),
// converts BGRA→NV12 (YUV 4:2:0) natively, and picks Main or High profile.
// Mux requires standard profiles (Baseline/Main/High, all 4:2:0) for live
// RTMP ingest — profile 122 (High 4:2:2) caused Mux to drop the video track
// entirely, resulting in audio-only playback for viewers.
const VIDEO_PARAM = { codecid: 27, profile: 0, width: 720, height: 1280, fps: 30, bitrate: 1500000 };

// Reconnection constants
const RECONNECT_INTERVAL_MS = 10_000; // retry every 10 s
const RECONNECT_TIMEOUT_MS = 5 * 60 * 1000; // give up after 5 min

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// Call a NodePublisher method via its JS wrapper (UIManager.dispatchViewManagerCommand).
// Do NOT call NativeModules.RCTNodePublisherManager alongside this — double-calling
// start() causes an immediate connect→disconnect (code 2000→2001) loop.
function callNP(ref: React.RefObject<any>, method: 'start' | 'stop') {
  ref.current?.[method]?.();
}

// ─── Types ────────────────────────────────────────────────────────────────────

// 'handoff'      = CameraView has unmounted; waiting for the OS to release the
//                  session before NodePublisher opens the same camera.
// 'reconnecting' = stream dropped (2004/2006); retrying every 10 s for 5 min.
type Phase = 'preview' | 'handoff' | 'connecting' | 'live' | 'reconnecting';

// ─── Component ────────────────────────────────────────────────────────────────

export function PhoneCameraScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { rtmpUrl, streamKey, eventId, mode = 'phone' } = route.params as {
    rtmpUrl: string; streamKey: string; eventId?: string; mode?: 'phone' | 'external';
  };
  const isExternal = mode === 'external';
  const { t } = useTranslation();
  const { recordLives } = usePreferences();
  const insets = useSafeAreaInsets();
  const nodeRef = useRef<any>(null);

  const [phase, setPhase] = useState<Phase>('preview');
  const [isFront, setIsFront] = useState(true);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guards against camera-init events (2000/2001) being mistaken for RTMP events.
  // Only set to true immediately before callNP(nodeRef, 'start') is dispatched.
  const hasStartedRef = useRef(false);
  // Reconnection state
  const reconnectStartRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // ── External mode: HLS preview ────────────────────────────────────────────
  const [extPlaybackUrl, setExtPlaybackUrl] = useState<string | null>(null);
  const [extIsLive, setExtIsLive] = useState(false);

  const hlsPlayer = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.muted = false;
  });

  // Listen to event changes in external mode
  useEffect(() => {
    if (!isExternal || !eventId) return;
    const unsub = eventsService.onEventChange(eventId, (e) => {
      if (!e) return;
      const live = e.status === 'live';
      setExtIsLive(live);
      if (e.playbackUrl && e.playbackUrl !== extPlaybackUrl) {
        setExtPlaybackUrl(e.playbackUrl);
      }
      if (live && !timerRef.current) {
        let startMs = Date.now();
        if (e.actualStartTime) {
          // Handle both ISO strings and Firestore Timestamp objects
          const parsed = typeof e.actualStartTime === 'string'
            ? new Date(e.actualStartTime).getTime()
            : (e.actualStartTime as any)?.toDate?.()?.getTime?.() ?? NaN;
          if (!isNaN(parsed)) startMs = parsed;
        }
        timerRef.current = setInterval(
          () => setDuration(Math.floor((Date.now() - startMs) / 1000)),
          1000,
        );
      }
      if (e.status === 'ended') {
        timerRef.current && clearInterval(timerRef.current);
        timerRef.current = null;
        setDuration(0);
      }
    });
    return () => {
      unsub();
      timerRef.current && clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExternal, eventId]);

  // Load HLS stream in external mode when playbackUrl becomes available
  useEffect(() => {
    if (!isExternal || !extPlaybackUrl || !extIsLive) return;
    hlsPlayer.replaceAsync({ uri: extPlaybackUrl, contentType: 'hls' as const })
      .then(() => hlsPlayer.play())
      .catch(() => {});
  }, [isExternal, extPlaybackUrl, extIsLive, hlsPlayer]);

  const fullUrl = `${rtmpUrl}/${streamKey}`;
  const isLive = isExternal ? extIsLive : phase === 'live';
  const isConnecting = !isExternal && phase === 'connecting';
  const isReconnecting = !isExternal && phase === 'reconnecting';

  // ── Permissions (phone mode only) ─────────────────────────────────────────

  useEffect(() => {
    if (isExternal) return;
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!micPermission?.granted) await requestMicPermission();
    })();
  }, [isExternal]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Camera handoff state machine ─────────────────────────────────────────────
  // When going live: preview → handoff (CameraView unmounts) → connecting
  // (NodePublisher mounts) → live (stream connected).
  useEffect(() => {
    if (phase !== 'handoff') return;
    // 800 ms gives iOS time to fully release the CameraView session before
    // NodePublisher's init opens the same camera device.
    const t = setTimeout(() => setPhase('connecting'), 800);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'connecting') return;
    // 400 ms for NodePublisher's componentDidMount + AVCaptureSession setup
    // before we tell the SDK to open the RTMP connection.
    const t = setTimeout(() => {
      hasStartedRef.current = true;
      callNP(nodeRef, 'start');
    }, 400);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);
      if (phase !== 'preview') callNP(nodeRef, 'stop');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── NodePublisher event handler ──────────────────────────────────────────────

  const handleStatus = useCallback((code: number, msg?: string) => {
    console.log('[NodePublisher] event code:', code, 'msg:', msg);
    if (!hasStartedRef.current) return;

    if (code === 2000) {
      // RTMP TCP connecting — already showing "CONNEXION…", no state change needed.
      return;
    }

    if (code === 2001) {
      // RTMP handshake succeeded (initial connect or successful reconnect).
      reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);
      reconnectStartRef.current = null;
      // Resume/start the duration timer.
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      setPhase('live');
      if (eventId) eventsService.updateEvent(eventId, { status: 'live' }).catch(() => {});
      return;
    }

    if (code === 2004 || code === 2006) {
      // Network disconnect or timeout — attempt reconnection for up to 5 min.
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = null;

      const isFirstDisconnect = reconnectStartRef.current === null;
      if (isFirstDisconnect) {
        reconnectStartRef.current = Date.now();
        if (eventId) eventsService.updateEvent(eventId, { status: 'reconnecting' }).catch(() => {});
      }

      const elapsed = Date.now() - (reconnectStartRef.current ?? Date.now());
      if (elapsed >= RECONNECT_TIMEOUT_MS) {
        hasStartedRef.current = false;
        reconnectStartRef.current = null;
        setDuration(0);
        setPhase('preview');
        if (eventId) eventsService.updateEvent(eventId, { status: 'ended' }).catch(() => {});
        return;
      }

      setPhase('reconnecting');
      reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (!hasStartedRef.current) return;
        callNP(nodeRef, 'start');
      }, RECONNECT_INTERVAL_MS);
      return;
    }

    // Any other code (2005, negative) = unrecoverable error.
    hasStartedRef.current = false;
    reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);
    reconnectStartRef.current = null;
    timerRef.current && clearInterval(timerRef.current);
    setDuration(0);
    setPhase('preview');
    if (code < 0) {
      Alert.alert(
        t('broadcaster.phoneCamera.connectionError'),
        t('broadcaster.phoneCamera.connectionErrorMessage', { code }),
      );
    }
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleGoLive = useCallback(() => {
    if (!NodePublisher) {
      Alert.alert(t('broadcaster.phoneCamera.buildRequired'), t('broadcaster.phoneCamera.buildRequiredMessage'));
      return;
    }
    setPhase('handoff'); // triggers the handoff state machine above
    setDuration(0);
  }, []);

  const handleStop = useCallback(() => {
    Alert.alert(t('broadcaster.phoneCamera.stopLiveTitle'), t('broadcaster.phoneCamera.stopLiveMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('broadcaster.phoneCamera.stop'),
        style: 'destructive',
        onPress: () => {
          if (isExternal) {
            // External mode: stop the Mux stream + mark ended
            if (eventId) {
              streamingService.stopStream(eventId).catch(() => {});
            }
            timerRef.current && clearInterval(timerRef.current);
            setDuration(0);
            if (recordLives && eventId) {
              navigation.replace('PostLive', { eventId });
            } else {
              navigation.goBack();
            }
          } else {
            hasStartedRef.current = false;
            reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);
            reconnectStartRef.current = null;
            callNP(nodeRef, 'stop');
            timerRef.current && clearInterval(timerRef.current);
            setPhase('preview');
            setDuration(0);
            if (eventId) eventsService.updateEvent(eventId, { status: 'ended' }).catch(() => {});
            if (recordLives && eventId) {
              navigation.replace('PostLive', { eventId });
            }
          }
        },
      },
    ]);
  }, [eventId, isExternal, navigation, recordLives]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBack() {
    if (isExternal) {
      if (extIsLive) {
        Alert.alert(t('broadcaster.phoneCamera.quitTitle'), t('broadcaster.phoneCamera.quitExternalMessage'), [
          { text: t('broadcaster.phoneCamera.stay'), style: 'cancel' },
          { text: t('common.quit'), onPress: () => navigation.goBack() },
        ]);
      } else {
        navigation.goBack();
      }
    } else if (phase !== 'preview') {
      Alert.alert(t('broadcaster.phoneCamera.quitTitle'), t('broadcaster.phoneCamera.quitPhoneMessage'), [
        { text: t('broadcaster.phoneCamera.stay'), style: 'cancel' },
        {
          text: t('common.quit'),
          style: 'destructive',
          onPress: () => { callNP(nodeRef, 'stop'); navigation.goBack(); },
        },
      ]);
    } else {
      navigation.goBack();
    }
  }

  // ── Permission wall ──────────────────────────────────────────────────────────

  if (!isExternal && cameraPermission != null && !cameraPermission.granted) {
    return (
      <View style={styles.permWall}>
        <Ionicons name="camera-off-outline" size={40} color={colors.textMuted} />
        <Text style={styles.permTitle}>{t('broadcaster.phoneCamera.permBlockedTitle')}</Text>
        <Text style={styles.permDesc}>
          {t('broadcaster.phoneCamera.permBlockedDesc')}
        </Text>
        <Pressable onPress={() => Linking.openSettings()} style={styles.permBtn}>
          <Text style={styles.permBtnText}>{t('broadcaster.phoneCamera.openSettings')}</Text>
        </Pressable>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* ── EXTERNAL MODE: HLS preview from Mux ──────────────────────────── */}
      {isExternal && (
        <>
          <VideoView
            player={hlsPlayer}
            style={styles.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
          {!extIsLive && (
            <View style={styles.extWaiting}>
              <Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={styles.extWaitingTitle}>{t('broadcaster.phoneCamera.extWaitingTitle')}</Text>
              <Text style={styles.extWaitingDesc}>
                {t('broadcaster.phoneCamera.extWaitingDesc')}
              </Text>
            </View>
          )}
        </>
      )}

      {/* ── PHONE MODE: PREVIEW PHASE — expo-camera ──────────────────────── */}
      {!isExternal && phase === 'preview' && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={isFront ? 'front' : 'back'}
        />
      )}

      {/* ── PHONE MODE: HANDOFF PHASE — black screen while camera transfers */}
      {/* (nothing rendered — root View's black background shows) */}

      {/* ── PHONE MODE: STREAMING PHASE — NodePublisher handles camera + RTMP */}
      {!isExternal && (phase === 'connecting' || phase === 'live' || phase === 'reconnecting') && NodePublisher && (
        <NodePublisher
          ref={nodeRef}
          style={StyleSheet.absoluteFill}
          frontCamera={isFront}
          videoOrientation={1}
          audioParam={AUDIO_PARAM}
          videoParam={VIDEO_PARAM}
          HWAccelEnable={true}
          url={fullUrl}
          onEvent={handleStatus}
        />
      )}

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          {/* Back */}
          <Pressable onPress={handleBack} hitSlop={12} style={styles.circleBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          {/* Status badge */}
          <View style={[
            styles.badge,
            isLive && styles.badgeLive,
            (isConnecting || isReconnecting) && styles.badgeConnecting,
          ]}>
            <View style={[
              styles.badgeDot,
              isLive && styles.badgeDotLive,
              (isConnecting || isReconnecting) && styles.badgeDotConnecting,
            ]} />
            <Text style={styles.badgeText}>
              {isLive
                ? t('broadcaster.phoneCamera.statusLive')
                : isExternal
                  ? t('broadcaster.phoneCamera.statusWaiting')
                  : isConnecting || phase === 'handoff'
                    ? t('broadcaster.phoneCamera.statusConnecting')
                    : isReconnecting
                      ? t('broadcaster.phoneCamera.statusReconnecting')
                      : t('broadcaster.phoneCamera.statusOffline')}
            </Text>
          </View>

          {/* Timer (live only) */}
          {isLive
            ? <Text style={styles.timer}>{formatDuration(duration)}</Text>
            : <View style={{ width: 56 }} />
          }
        </View>
      </View>

      {/* ── BOTTOM BAR ──────────────────────────────────────────────────────── */}
      <View style={styles.bottomOverlay} pointerEvents="box-none">
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
          {/* Flip camera (phone mode only) */}
          {!isExternal ? (
            <Pressable
              onPress={() => setIsFront((v) => !v)}
              hitSlop={12}
              style={[styles.circleBtn, (phase === 'handoff' || phase === 'connecting' || phase === 'reconnecting') && styles.circleBtnDisabled]}
              disabled={phase === 'handoff' || phase === 'connecting' || phase === 'reconnecting'}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
            </Pressable>
          ) : (
            <View style={{ width: 44 }} />
          )}

          {/* Go live / Stop */}
          {(isLive || isReconnecting) ? (
            <Pressable onPress={handleStop} style={[styles.mainBtn, styles.mainBtnStop]}>
              <View style={styles.stopSquare} />
              <Text style={styles.mainBtnText}>{t('broadcaster.phoneCamera.stop')}</Text>
            </Pressable>
          ) : isExternal ? (
            <View style={[styles.mainBtn, styles.mainBtnConnecting]}>
              <Ionicons name="radio-outline" size={20} color="#fff" />
              <Text style={styles.mainBtnText}>{t('broadcaster.phoneCamera.waiting')}</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleGoLive}
              disabled={phase !== 'preview'}
              style={[styles.mainBtn, phase !== 'preview' && styles.mainBtnConnecting]}
            >
              <Ionicons name="radio-outline" size={20} color="#fff" />
              <Text style={styles.mainBtnText}>
                {phase === 'preview' ? t('broadcaster.phoneCamera.goLive') : t('broadcaster.phoneCamera.connecting')}
              </Text>
            </Pressable>
          )}

          {/* Spacer */}
          <View style={{ width: 44 }} />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── Overlays ────────────────────────────────────────────────────────────────
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xl,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.xl,
  },

  // ── Bars ────────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },

  // ── Circle button ─────────────────────────────────────────────────────────
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnDisabled: {
    opacity: 0.4,
  },

  // ── Status badge ─────────────────────────────────────────────────────────
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeLive: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  badgeConnecting: {
    backgroundColor: 'rgba(234,179,8,0.2)',
    borderColor: 'rgba(234,179,8,0.3)',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  badgeDotLive: {
    backgroundColor: '#ef4444',
  },
  badgeDotConnecting: {
    backgroundColor: '#eab308',
  },
  badgeText: {
    color: '#fff',
    fontFamily: fonts.heading.bold,
    fontSize: 10,
    letterSpacing: 1,
  },

  // ── Timer ────────────────────────────────────────────────────────────────
  timer: {
    color: '#fff',
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    width: 56,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ── Main button ──────────────────────────────────────────────────────────
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  mainBtnStop: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  mainBtnConnecting: {
    backgroundColor: 'rgba(151,77,251,0.5)',
    shadowOpacity: 0,
  },
  mainBtnText: {
    color: '#fff',
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 0.5,
  },
  stopSquare: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#fff',
  },

  // ── External mode ───────────────────────────────────────────────────────
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  extWaiting: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  extWaitingTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    textAlign: 'center' as const,
    marginTop: spacing.md,
  },
  extWaitingDesc: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center' as const,
    lineHeight: 20,
  },

  // ── Permission wall ──────────────────────────────────────────────────────
  permWall: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  permTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    textAlign: 'center',
  },
  permDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  permBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  permBtnText: {
    color: '#fff',
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.sm,
  },
});
