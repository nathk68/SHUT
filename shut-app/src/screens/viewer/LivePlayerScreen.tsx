import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { REACTION_EMOJIS, ReactionType } from '../../config/constants';
import { chatService, eventsService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import type { HomeStackParamList } from '../../navigation/ViewerTabs';

interface ChatMessage {
  id: string;
  userName: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Floating reaction overlay
// ---------------------------------------------------------------------------

// Set of all reaction emoji values for quick lookup
const REACTION_EMOJI_SET = new Set(Object.values(REACTION_EMOJIS));

function FloatingEmoji({ emoji, onDone }: { emoji: string; onDone: () => void }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const randomX = useRef(Math.random() * (Dimensions.get('window').width - 60) + 20).current;
  // Stable ref so animation completion always calls the latest onDone without restarting
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -250,
        duration: 1800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1800,
        useNativeDriver: true,
      }),
    ]).start(() => onDoneRef.current());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingEmoji,
        {
          left: randomX,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<HomeStackParamList, 'LivePlayer'>;

export function LivePlayerScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string }[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const chatRef = useRef<FlatList>(null);
  // Track IDs of messages sent by this user to avoid duplicates from the listener
  const sentIdsRef = useRef<Set<string>>(new Set());

  const videoPlayer = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.muted = false;
  });

  // Fetch initial messages + subscribe to new ones
  useEffect(() => {
    chatService.getMessages(eventId).then((msgs) => {
      setMessages(msgs.map((m) => ({ id: m.id, userName: m.userName, text: m.text })));
    });
    const unsub = chatService.onNewMessage(eventId, (msg) => {
      // Skip messages we already added optimistically
      if (sentIdsRef.current.has(msg.id)) return;
      if (REACTION_EMOJI_SET.has(msg.text)) {
        // Incoming reaction from another viewer → trigger floating animation
        const id = msg.id + Math.random();
        setFloatingEmojis((prev) => [...prev, { id, emoji: msg.text }]);
      } else {
        setMessages((prev) => [...prev, { id: msg.id, userName: msg.userName, text: msg.text }]);
      }
    });
    return unsub;
  }, [eventId]);

  // Fetch event data (viewer count + playback URL) + track presence
  useEffect(() => {
    eventsService.getEventById(eventId).then((e) => {
      if (e) {
        setViewCount(e.viewerCount);
        if (e.playbackUrl) {
          setPlaybackUrl(e.playbackUrl);
          videoPlayer.replaceAsync({ uri: e.playbackUrl }).then(() => videoPlayer.play());
        }
      }
    });
    eventsService.incrementViewerCount(eventId, 1).catch(() => {});
    return () => {
      eventsService.incrementViewerCount(eventId, -1).catch(() => {});
    };
  }, [eventId, videoPlayer]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    const timeout = setTimeout(() => {
      chatRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages]);

  // Send message: clears input immediately, adds optimistically, deduplicates from listener
  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText('');
    Keyboard.dismiss();
    const userId = user?.id ?? 'anonymous';
    const userName = user?.displayName ?? 'Moi';
    try {
      const sent = await chatService.sendMessage(eventId, userId, userName, trimmed);
      sentIdsRef.current.add(sent.id);
      setMessages((prev) => [...prev, { id: sent.id, userName: sent.userName, text: sent.text }]);
    } catch { /* ignore */ }
  }, [inputText, user, eventId]);

  // Send reaction: broadcast via chat, show locally immediately
  const handleReaction = useCallback((type: ReactionType) => {
    const emoji = REACTION_EMOJIS[type];
    const id = String(Date.now()) + Math.random();
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    // Broadcast to all viewers via chat (fire-and-forget)
    const userId = user?.id ?? 'anonymous';
    const userName = user?.displayName ?? 'Moi';
    chatService.sendMessage(eventId, userId, userName, emoji).then((sent) => {
      sentIdsRef.current.add(sent.id); // don't show as incoming reaction for sender
    }).catch(() => {});
  }, [user, eventId]);

  const removeFloatingEmoji = useCallback((id: string) => {
    setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View style={styles.messageRow}>
        <Text style={styles.messageName}>{item.userName}</Text>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    ),
    [],
  );

  const reactionKeys = Object.keys(REACTION_EMOJIS) as ReactionType[];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Video area */}
      {playbackUrl ? (
        <VideoView
          player={videoPlayer}
          style={styles.videoArea}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.videoArea}
        >
          <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.waitingLabel}>En attente du flux...</Text>
        </LinearGradient>
      )}

      {/* Top overlay */}
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

      {/* Floating emoji overlay */}
      {floatingEmojis.map((fe) => (
        <FloatingEmoji
          key={fe.id}
          emoji={fe.emoji}
          onDone={() => removeFloatingEmoji(fe.id)}
        />
      ))}

      {/* Chat + reactions overlay at bottom */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomOverlay}
        keyboardVerticalOffset={0}
      >
        {/* Chat messages */}
        <View style={styles.chatContainer}>
          <LinearGradient
            colors={['transparent', 'rgba(8,8,15,0.85)']}
            style={styles.chatGradient}
          >
            <FlatList
              ref={chatRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatContent}
            />
          </LinearGradient>
        </View>

        {/* Reaction buttons */}
        <View style={styles.reactionsRow}>
          {reactionKeys.map((key) => (
            <Pressable
              key={key}
              onPress={() => handleReaction(key)}
              style={({ pressed }) => [
                styles.reactionButton,
                { opacity: pressed ? 0.5 : 1, transform: [{ scale: pressed ? 1.3 : 1 }] },
              ]}
            >
              <Text style={styles.reactionEmoji}>{REACTION_EMOJIS[key]}</Text>
            </Pressable>
          ))}
        </View>

        {/* Message input */}
        <View style={[styles.inputRow, { paddingBottom: insets.bottom || spacing.md }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Envoyer un message..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [styles.sendButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="send" size={18} color={colors.accentLight} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  videoArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.md,
  },

  // Top overlay
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

  // Floating emojis
  floatingEmoji: {
    position: 'absolute',
    bottom: 200,
    fontSize: 32,
    zIndex: 20,
  },

  // Bottom overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  // Chat
  chatContainer: {
    height: 200,
  },
  chatGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    alignItems: 'baseline',
  },
  messageName: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.accentLight,
    marginRight: spacing.sm,
  },
  messageText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    flexShrink: 1,
  },

  // Reactions row
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 22,
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(8,8,15,0.9)',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
