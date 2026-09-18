import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { DashboardStackParamList } from '../../navigation/BroadcasterTabs';
import { formatDuration } from '../../utils/formatDuration';
import { eventsService, chatService, streamingService } from '../../services';
import { LiveEvent, ChatMessage as ChatMsg } from '../../types';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '../../config/theme';

type Navigation = NativeStackNavigationProp<DashboardStackParamList, 'LiveControl'>;
type Route = RouteProp<DashboardStackParamList, 'LiveControl'>;

interface ChatMessage {
  id: string;
  userName: string;
  text: string;
}

export function LiveControlScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { eventId } = route.params;

  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamHealth, setStreamHealth] = useState<'active' | 'idle' | 'disconnected'>('disconnected');
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const videoPlayer = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.muted = false;
  });

  // Fetch event details
  useEffect(() => {
    eventsService.getEventById(eventId).then((e) => {
      if (e) {
        setEvent(e);
        setIsLive(e.status === 'live');
        if (e.playbackUrl) setPlaybackUrl(e.playbackUrl);
      }
    });
  }, [eventId]);

  // Listen for chat messages
  useEffect(() => {
    chatService.getMessages(eventId).then((msgs) => {
      setChatMessages(msgs.slice(-4).map((m) => ({
        id: m.id,
        userName: m.userName,
        text: m.text,
      })));
    });
    const unsub = chatService.onNewMessage(eventId, (msg) => {
      setChatMessages((prev) => [...prev.slice(-3), {
        id: msg.id,
        userName: msg.userName,
        text: msg.text,
      }]);
    });
    return unsub;
  }, [eventId]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for the GO LIVE button
  useEffect(() => {
    if (!isLive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [isLive, pulseAnim]);

  // Live glow animation for the recording dot
  useEffect(() => {
    if (isLive) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      glow.start();
      return () => glow.stop();
    }
  }, [isLive, glowAnim]);

  // Duration — starts from event.actualStartTime if available (set by Mux webhook)
  useEffect(() => {
    if (isLive) {
      const startMs = event?.actualStartTime
        ? new Date(event.actualStartTime).getTime()
        : Date.now();
      const tick = () => setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive, event?.actualStartTime]);

  // Viewer count — poll Firestore every 10s
  useEffect(() => {
    if (!isLive) {
      setViewerCount(0);
      return;
    }
    const refresh = async () => {
      const e = await eventsService.getEventById(eventId);
      if (e) setViewerCount(e.viewerCount ?? 0);
    };
    refresh();
    viewerRef.current = setInterval(refresh, 10000);
    return () => {
      if (viewerRef.current) clearInterval(viewerRef.current);
    };
  }, [isLive, eventId]);

  // Load and play video only when Mux stream is actually active
  useEffect(() => {
    if (isLive && playbackUrl && streamHealth === 'active') {
      videoPlayer.replaceAsync({ uri: playbackUrl }).then(() => videoPlayer.play());
    } else {
      videoPlayer.pause();
    }
  }, [isLive, playbackUrl, streamHealth, videoPlayer]);

  // Stream health — poll Mux status every 15s
  useEffect(() => {
    if (!isLive || !event?.muxLiveStreamId) {
      setStreamHealth('disconnected');
      return;
    }
    const poll = async () => {
      try {
        const result = await streamingService.getLiveStreamStatusById(event.muxLiveStreamId!);
        setStreamHealth(result.status === 'active' ? 'active' : 'idle');
      } catch { /* ignore */ }
    };
    poll();
    const healthInterval = setInterval(poll, 15000);
    return () => clearInterval(healthInterval);
  }, [isLive, event?.muxLiveStreamId]);

  const handleToggleLive = useCallback(async () => {
    if (!isLive) {
      // Credentials already created in StreamSetupScreen — just mark as live
      try {
        await eventsService.setEventStatus(eventId, 'live');
      } catch (_) { /* ignore */ }
    } else {
      try {
        await streamingService.stopStream(eventId);
      } catch (_) { /* ignore */ }
    }
    setIsLive((prev) => !prev);
  }, [isLive, eventId]);

  return (
    <ScreenContainer edges={['top']} style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton
          icon="close"
          onPress={() => navigation.goBack()}
          size={24}
          color={colors.textPrimary}
        />
        <View style={styles.topCenter}>
          {isLive && (
            <View style={styles.liveBadge}>
              <Animated.View
                style={[styles.liveDot, { opacity: glowAnim }]}
              />
              <Text style={styles.liveText}>EN DIRECT</Text>
            </View>
          )}
        </View>
        <View style={styles.topSpacer} />
      </View>

      {/* Event title */}
      <Text style={styles.eventTitle}>{event?.title ?? 'Chargement...'}</Text>

      {/* Center area */}
      <View style={styles.centerArea}>
        {!isLive ? (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable onPress={handleToggleLive}>
              <LinearGradient
                colors={[colors.live, '#b91c1c']}
                style={styles.goLiveButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="radio" size={36} color={colors.white} />
                <Text style={styles.goLiveText}>GO LIVE</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.liveArea}>
            {/* HLS preview — what viewers see (~15s delay) */}
            <View style={styles.previewContainer}>
              {playbackUrl && streamHealth === 'active' ? (
                <VideoView
                  player={videoPlayer}
                  style={styles.previewVideo}
                  contentFit="contain"
                  nativeControls={false}
                />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Ionicons name="videocam-off-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.previewPlaceholderText}>
                    {streamHealth === 'active'
                      ? 'Chargement...'
                      : 'Caméra non connectée'}
                  </Text>
                  <Text style={styles.previewSubText}>
                    {streamHealth === 'idle'
                      ? 'Le flux Mux est prêt, connectez votre caméra'
                      : 'Générez les identifiants et connectez la caméra'}
                  </Text>
                </View>
              )}
              {playbackUrl && streamHealth === 'active' && (
                <View style={styles.previewLatencyBadge}>
                  <Text style={styles.previewLatencyText}>~15s latence HLS</Text>
                </View>
              )}
            </View>

            <Pressable onPress={handleToggleLive} style={styles.endLiveButton}>
              <Ionicons name="stop-circle-outline" size={28} color={colors.live} />
              <Text style={styles.endLiveText}>TERMINER</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Stats row (visible when live) */}
      {isLive && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              <Ionicons name="people" size={16} color={colors.accentLight} />
            </View>
            <Text style={styles.statValue}>
              {viewerCount.toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.statLabel}>Spectateurs</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              <Ionicons name="time" size={16} color={colors.accentLight} />
            </View>
            <Text style={styles.statValue}>
              {formatDuration(elapsedSeconds)}
            </Text>
            <Text style={styles.statLabel}>Duree</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              <View style={[
                styles.healthDot,
                streamHealth === 'active' && { backgroundColor: colors.success },
                streamHealth === 'idle' && { backgroundColor: colors.warning },
                streamHealth === 'disconnected' && { backgroundColor: colors.live },
              ]} />
            </View>
            <Text style={[
              styles.statValueHealth,
              streamHealth === 'active' && { color: colors.success },
              streamHealth === 'idle' && { color: colors.warning },
              streamHealth === 'disconnected' && { color: colors.live },
            ]}>
              {streamHealth === 'active' ? 'Actif' : streamHealth === 'idle' ? 'En attente' : 'Hors ligne'}
            </Text>
            <Text style={styles.statLabel}>Qualite</Text>
          </View>
        </View>
      )}

      {/* Chat preview */}
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <Ionicons name="chatbubbles-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.chatTitle}>Chat en direct</Text>
        </View>
        <View style={styles.chatMessages}>
          {chatMessages.map((msg) => (
            <View key={msg.id} style={styles.chatMessage}>
              <Text style={styles.chatUser}>{msg.userName}</Text>
              <Text style={styles.chatText}>{msg.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topCenter: {
    alignItems: 'center',
  },
  topSpacer: {
    width: 38,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.live,
    marginRight: spacing.sm,
  },
  liveText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xs,
    color: colors.live,
    letterSpacing: 1,
  },
  eventTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.live}40`,
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  previewPlaceholderText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  previewSubText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  previewLatencyBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  previewLatencyText: {
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  goLiveButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.live,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  goLiveText: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.white,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },
  endLiveButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.live,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  endLiveText: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    color: colors.live,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconRow: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  statValueHealth: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.md,
    color: colors.success,
  },
  statLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  chatContainer: {
    backgroundColor: colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chatTitle: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  chatMessages: {
    gap: spacing.sm,
  },
  chatMessage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chatUser: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.accentLight,
    marginRight: spacing.sm,
  },
  chatText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});
