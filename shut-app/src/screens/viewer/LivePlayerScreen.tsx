import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { LiveActionBar } from '../../components/live/LiveActionBar';
import { ReportModal } from '../../components/report/ReportModal';
import { eventsService, userService } from '../../services';
import type { HomeStackParamList } from '../../navigation/ViewerTabs';

type Props = NativeStackScreenProps<HomeStackParamList, 'LivePlayer'>;

export function LivePlayerScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [viewCount, setViewCount] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [djName, setDjName] = useState('');
  const [djAvatarUrl, setDjAvatarUrl] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  // ── Video player: create once with null source, then use replaceAsync.
  //    This ensures the AVPlayerViewController's video layer is connected
  //    BEFORE the source is loaded (avoiding the audio-only race condition
  //    that occurs when the player is recreated via source change).
  const videoPlayer = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const videoLoadedRef = useRef(false);
  const userFetchedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Firestore listener + stream loading
  useEffect(() => {
    videoLoadedRef.current = false;
    userFetchedRef.current = false;

    const MAX_RETRIES = 24;
    let retryCount = 0;

    // Fetch & log the HLS manifest to verify video tracks exist
    function checkManifest(url: string) {
      fetch(url)
        .then((r) => r.text())
        .then((text) => {
          const hasVideo = /RESOLUTION=/.test(text) || /VIDEO/.test(text);
          console.log('[LivePlayer] HLS manifest has video:', hasVideo);
          console.log('[LivePlayer] manifest:\n', text.substring(0, 1000));
        })
        .catch((err) => console.warn('[LivePlayer] Manifest fetch failed:', err));
    }

    function loadStream(url: string) {
      console.log(`[LivePlayer] replaceAsync (attempt ${retryCount + 1})…`);
      videoPlayer.replaceAsync({ uri: url, contentType: 'hls' as const })
        .then(() => {
          console.log('[LivePlayer] replaceAsync resolved — calling play()');
          videoPlayer.play();
          setPlaybackUrl(url);
        })
        .catch((err) => {
          console.warn('[LivePlayer] replaceAsync failed:', err);
          retryCount++;
          if (retryCount < MAX_RETRIES) {
            retryTimerRef.current = setTimeout(() => loadStream(url), 5000);
          }
        });
    }

    const unsubEvent = eventsService.onEventChange(eventId, (e) => {
      if (!e) return;

      setViewCount(e.viewerCount ?? 0);
      setIsReconnecting(e.status === 'reconnecting');

      if (e.status === 'ended') {
        navigation.goBack();
        return;
      }

      if (e.djName) setDjName(e.djName);

      // Load video as soon as playbackUrl becomes available
      if (e.playbackUrl && !videoLoadedRef.current) {
        videoLoadedRef.current = true;
        console.log('[LivePlayer] playbackUrl received:', e.playbackUrl);
        checkManifest(e.playbackUrl);
        loadStream(e.playbackUrl);
      }

      // Fetch DJ avatar + displayName from user profile (once)
      const userId = e.userId;
      if (userId && !userFetchedRef.current) {
        userFetchedRef.current = true;
        console.log('[LivePlayer] Fetching DJ profile for userId:', userId);
        userService.getUserById(userId).then((u) => {
          console.log('[LivePlayer] DJ profile:', u?.artistName, u?.displayName, u?.avatarUrl ? '(has avatar)' : '(no avatar)');
          if (u?.avatarUrl) setDjAvatarUrl(u.avatarUrl);
          const name = u?.artistName || u?.username || u?.displayName;
          if (name) setDjName((prev) => prev || name);
        }).catch((err) => {
          console.warn('[LivePlayer] Failed to fetch DJ profile:', err);
        });
      }
    });

    // Listen for video track info (diagnostic)
    const sourceLoadSub = videoPlayer.addListener('sourceLoad', (payload) => {
      console.log('[LivePlayer] sourceLoad — videoTracks:', payload.availableVideoTracks.length, 'audioTracks:', payload.availableAudioTracks.length);
      if (payload.availableVideoTracks.length > 0) {
        const t = payload.availableVideoTracks[0];
        console.log('[LivePlayer] first video track:', t.size.width, 'x', t.size.height);
      } else {
        console.warn('[LivePlayer] ⚠️ NO VIDEO TRACKS in HLS stream — Mux may be dropping video');
      }
    });

    eventsService.incrementViewerCount(eventId, 1).catch(() => {});

    return () => {
      retryTimerRef.current && clearTimeout(retryTimerRef.current);
      sourceLoadSub.remove();
      unsubEvent();
      eventsService.incrementViewerCount(eventId, -1).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, navigation]);

  const handleClose = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Video player — always mounted so the rendering surface is ready
           BEFORE replaceAsync loads the stream. Conditional mounting caused a
           race: player.play() fired while VideoView hadn't mounted yet, so
           audio played (no view needed) but video had no surface to render. */}
      <VideoView
        player={videoPlayer}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        onFirstFrameRender={() => console.log('[LivePlayer] ✅ First video frame rendered!')}
      />

      {/* Gradient overlay while waiting for stream */}
      {!playbackUrl && (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.waitingOverlay}
        >
          <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.waitingLabel}>{t('live.waitingForStream')}</Text>
        </LinearGradient>
      )}

      {/* Reconnecting overlay */}
      {isReconnecting && (
        <View style={styles.reconnectOverlay}>
          <Ionicons name="wifi-outline" size={36} color="rgba(255,255,255,0.5)" />
          <Text style={styles.reconnectTitle}>{t('live.unstableConnection')}</Text>
          <Text style={styles.reconnectSub}>{t('live.broadcasterReconnecting')}</Text>
        </View>
      )}

      {/* Top bar: close + LIVE badge + viewer count */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="close" size={24} color={colors.white} />
        </Pressable>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>

        <View style={styles.viewerCount}>
          <Ionicons name="eye" size={14} color={colors.textPrimary} />
          <Text style={styles.viewerCountText}>{viewCount}</Text>
        </View>
      </View>

      {/* DJ name — bottom left */}
      {djName ? (
        <View style={[styles.djNameContainer, { bottom: insets.bottom + spacing.xl }]}>
          <Text style={styles.djNameText} numberOfLines={1}>{djName}</Text>
        </View>
      ) : null}

      {/* Right-side action bar — anchored at the bottom */}
      <LiveActionBar
        eventId={eventId}
        djAvatarUrl={djAvatarUrl}
        djName={djName}
        bottomInset={insets.bottom}
      />

      {/* Report button — top right */}
      <Pressable
        style={[styles.reportBtn, { top: insets.top + spacing.sm }]}
        onPress={() => setReportVisible(true)}
      >
        <Ionicons name="flag-outline" size={18} color="rgba(255,255,255,0.7)" />
      </Pressable>

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        targetType="event"
        targetId={eventId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  waitingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  waitingLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.md,
  },
  reconnectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 5,
  },
  reconnectTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.white,
    letterSpacing: 0.5,
  },
  reconnectSub: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.live,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginRight: spacing.xs + 1,
  },
  liveBadgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xs,
    color: colors.white,
    letterSpacing: 1,
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  viewerCountText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  djNameContainer: {
    position: 'absolute',
    left: spacing.md,
    right: 80,
    zIndex: 10,
  },
  djNameText: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reportBtn: {
    position: 'absolute',
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
