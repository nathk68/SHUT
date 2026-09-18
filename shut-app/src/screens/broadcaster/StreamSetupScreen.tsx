import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Header } from '../../components/layout/Header';
import { GlassCard } from '../../components/ui/GlassCard';
import { IconButton } from '../../components/ui/IconButton';
import { EventStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PlanningStackParamList } from '../../navigation/BroadcasterTabs';
import { copyToClipboard } from '../../utils/clipboard';
import { formatEventDate } from '../../utils/formatDate';
import { eventsService, streamingService } from '../../services';
import type { LiveEvent } from '../../types';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '../../config/theme';

type Navigation = NativeStackNavigationProp<PlanningStackParamList, 'StreamSetup'>;
type Route = RouteProp<PlanningStackParamList, 'StreamSetup'>;

export function StreamSetupScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { eventId } = route.params;
  const [showKey, setShowKey] = useState(false);
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [stopping, setStopping] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  const fetchEvent = useCallback(async () => {
    try {
      const e = await eventsService.getEventById(eventId);
      setEvent(e);
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePrepareStream = useCallback(async () => {
    if (!event) return;
    setPreparing(true);
    try {
      await streamingService.startStream(eventId, event.cameraId);
      // Reload event to get the muxStreamKey / muxRtmpUrl written by Cloud Function
      await fetchEvent();
    } catch (error: any) {
      const msg = error?.message ?? error?.code ?? JSON.stringify(error);
      Alert.alert('Erreur', msg);
    } finally {
      setPreparing(false);
    }
  }, [event, eventId, fetchEvent]);

  const rtmpUrl = event?.muxRtmpUrl || 'rtmp://global-live.mux.com:5222/app';
  const streamKey = event?.muxStreamKey || null;
  const fullRtmpUrl = streamKey ? `${rtmpUrl}/${streamKey}` : rtmpUrl;
  const maskedKey = streamKey ? streamKey.replace(/./g, '\u2022') : '';
  const hasCredentials = !!streamKey;

  const handleCopyUrl = () => copyToClipboard(rtmpUrl);
  const handleCopyKey = () => { if (streamKey) copyToClipboard(streamKey); };
  const handleCopyFullUrl = () => copyToClipboard(fullRtmpUrl);

  const handleStopEvent = useCallback(() => {
    Alert.alert(
      'Terminer l\'événement',
      'Cela arrêtera le flux et marquera l\'événement comme terminé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: async () => {
            setStopping(true);
            try {
              await streamingService.stopStream(eventId);
              await fetchEvent();
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erreur', error?.message ?? 'Impossible d\'arrêter le stream.');
            } finally {
              setStopping(false);
            }
          },
        },
      ],
    );
  }, [eventId, fetchEvent, navigation]);

  const handleGoLive = useCallback(() => {
    if (!event) return;
    // Cross-stack navigation: always go to Dashboard tab → LiveControl
    (navigation as any).navigate('Dashboard', {
      screen: 'LiveControl',
      params: { eventId: event.id },
    });
  }, [navigation, event]);

  if (loading) {
    return (
      <ScreenContainer>
        <Header title="Configuration Stream" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentLight} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header
        title="Configuration Stream"
        right={
          <IconButton
            icon="arrow-back"
            onPress={() => navigation.goBack()}
            size={22}
            color={colors.textPrimary}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Event info card */}
        <GlassCard style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event?.title ?? 'Event'}</Text>
              <View style={styles.eventMeta}>
                <Ionicons name="musical-notes" size={14} color={colors.accentLight} />
                <Text style={styles.eventDj}>{event?.djName ?? ''}</Text>
              </View>
              <View style={styles.eventMeta}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.eventDate}>
                  {event ? formatEventDate(event.scheduledStartTime) : ''}
                </Text>
              </View>
            </View>
            {event && <EventStatusBadge status={event.status} />}
          </View>
        </GlassCard>

        {/* Generate credentials CTA if not yet created */}
        {!hasCredentials ? (
          <GlassCard style={styles.prepareCard}>
            <View style={styles.prepareHeader}>
              <Ionicons name="key-outline" size={24} color={colors.accentLight} />
              <Text style={styles.prepareTitle}>Identifiants non générés</Text>
            </View>
            <Text style={styles.prepareText}>
              Générez les identifiants RTMP pour configurer votre caméra ou OBS
              avant de commencer le live.
            </Text>
            <Button
              title={preparing ? 'Génération...' : 'Générer les identifiants'}
              onPress={handlePrepareStream}
              size="md"
              style={styles.prepareButton}
            />
          </GlassCard>
        ) : (
          <>
            {/* Stream settings section */}
            <Text style={styles.sectionTitle}>Paramètres de diffusion</Text>

            {/* DJI guide */}
            <GlassCard style={styles.djiCard}>
              <View style={styles.djiHeader}>
                <Ionicons name="videocam-outline" size={18} color={colors.accentLight} />
                <Text style={styles.djiTitle}>DJI Osmo Pocket 3 — Guide rapide</Text>
              </View>

              {/* Audio connection reminder */}
              <View style={styles.djiAudioReminder}>
                <Ionicons name="musical-notes-outline" size={13} color={colors.warning} />
                <Text style={styles.djiAudioReminderText}>
                  Audio : Mixer BOOTH/REC out → câble TRS 3.5mm → entrée mic Osmo (volume table à 30–40%)
                </Text>
              </View>

              {/* Steps */}
              {[
                { n: 1, text: 'Ouvre DJI Mimo et connecte ton Osmo Pocket 3' },
                { n: 2, text: 'Onglet Live → "RTMP personnalisé" (Custom RTMP)' },
                { n: 3, text: 'Colle l\'URL complète ci-dessous (URL + clé concaténées)' },
                { n: 4, text: 'Vérifie le niveau audio dans les réglages Mimo, puis démarre' },
              ].map(({ n, text }) => (
                <View key={n} style={styles.djiStep}>
                  <View style={styles.djiStepNum}>
                    <Text style={styles.djiStepNumText}>{n}</Text>
                  </View>
                  <Text style={styles.djiStepText}>{text}</Text>
                </View>
              ))}
            </GlassCard>

            {/* Full RTMP URL for DJI Mimo */}
            <View style={styles.streamField}>
              <View style={styles.streamFieldHeader}>
                <Text style={styles.streamFieldLabel}>URL complète (DJI Mimo)</Text>
                <Pressable onPress={handleCopyFullUrl} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={16} color={colors.accentLight} />
                  <Text style={styles.copyText}>Copier</Text>
                </Pressable>
              </View>
              <View style={styles.streamValueBox}>
                <Text style={styles.streamValue} selectable>
                  {fullRtmpUrl}
                </Text>
              </View>
            </View>

            {/* RTMP URL */}
            <View style={styles.streamField}>
              <View style={styles.streamFieldHeader}>
                <Text style={styles.streamFieldLabel}>URL RTMP</Text>
                <Pressable onPress={handleCopyUrl} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={16} color={colors.accentLight} />
                  <Text style={styles.copyText}>Copier</Text>
                </Pressable>
              </View>
              <View style={styles.streamValueBox}>
                <Text style={styles.streamValue} selectable>
                  {rtmpUrl}
                </Text>
              </View>
            </View>

            {/* Stream Key */}
            <View style={styles.streamField}>
              <View style={styles.streamFieldHeader}>
                <Text style={styles.streamFieldLabel}>Clé de stream</Text>
                <View style={styles.streamFieldActions}>
                  <Pressable
                    onPress={() => setShowKey(!showKey)}
                    style={styles.toggleButton}
                  >
                    <Ionicons
                      name={showKey ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable onPress={handleCopyKey} style={styles.copyButton}>
                    <Ionicons name="copy-outline" size={16} color={colors.accentLight} />
                    <Text style={styles.copyText}>Copier</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.streamValueBox}>
                <Text style={styles.streamValue} selectable={showKey}>
                  {showKey ? streamKey! : maskedKey}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Instructions */}
        <GlassCard style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accentLight} />
            <Text style={styles.instructionsTitle}>Instructions</Text>
          </View>
          <Text style={styles.instructionsText}>
            Configurez ces paramètres dans votre caméra SHUT, DJI Mimo (Live → RTMP
            personnalisé), OBS (Paramètres → Stream → Service: Personnalisé), ou tout
            encodeur RTMP compatible.
          </Text>
        </GlassCard>

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <Animated.View style={[
            styles.statusDot,
            { opacity: pulseAnim },
            event?.status === 'live' && { backgroundColor: colors.live },
          ]} />
          <Text style={[
            styles.statusText,
            event?.status === 'live' && { color: colors.live },
          ]}>
            {event?.status === 'live' ? '🔴 Live en cours' : hasCredentials ? 'En attente du flux...' : 'Identifiants non configurés'}
          </Text>
        </View>

        {/* Lancer le live — credentials prêts mais pas encore live */}
        {hasCredentials && event?.status !== 'live' && event?.status !== 'ended' && (
          <Button
            title="Lancer le live →"
            onPress={handleGoLive}
            size="lg"
            style={styles.goLiveButton}
          />
        )}

        {/* Rejoindre + Terminer — quand le live est actif */}
        {event?.status === 'live' && (
          <>
            <Button
              title="Rejoindre le dashboard →"
              onPress={handleGoLive}
              size="lg"
              style={styles.goLiveButton}
            />
            <Button
              title={stopping ? 'Arrêt en cours...' : 'Terminer l\'événement'}
              onPress={handleStopEvent}
              size="lg"
              style={styles.stopButton}
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  eventCard: {
    marginBottom: spacing.lg,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  eventTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventDj: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.accentLight,
    marginLeft: spacing.sm,
  },
  eventDate: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  // Prepare card
  prepareCard: {
    marginBottom: spacing.lg,
  },
  prepareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  prepareTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  prepareText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  prepareButton: {
    alignSelf: 'flex-start',
  },
  // DJI guide
  djiCard: {
    marginBottom: spacing.md,
    backgroundColor: `${colors.accentLight}08`,
  },
  djiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  djiTitle: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.accentLight,
  },
  djiAudioReminder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: `${colors.warning}12`,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.warning}20`,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  djiAudioReminderText: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.warning,
    lineHeight: 16,
  },
  djiStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  djiStepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${colors.accent}28`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  djiStepNumText: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: 10,
  },
  djiStepText: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  streamField: {
    marginBottom: spacing.md,
  },
  streamFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  streamFieldLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  streamFieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleButton: {
    padding: spacing.xs,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: `${colors.accentLight}15`,
    borderRadius: borderRadius.sm,
  },
  copyText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.accentLight,
  },
  streamValueBox: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  streamValue: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  instructionsCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  instructionsTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  instructionsText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
    marginRight: spacing.sm,
  },
  statusText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.sm,
    color: colors.warning,
    letterSpacing: 0.5,
  },
  goLiveButton: {
    marginBottom: spacing.lg,
  },
  stopButton: {
    marginBottom: spacing.lg,
    backgroundColor: colors.live,
  },
});
