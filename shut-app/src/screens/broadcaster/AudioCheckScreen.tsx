import React, { useState, useRef, useCallback } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

// ─── Audio source options ──────────────────────────────────────────────────────

type AudioSourceId = 'mixer-osmo' | 'usb-interface' | 'builtin';

interface AudioOption {
  id: AudioSourceId;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  steps: string[];
  warning?: string;
}

const AUDIO_OPTIONS: AudioOption[] = [
  {
    id: 'mixer-osmo',
    icon: 'git-network-outline',
    label: 'Table de mix → Osmo Pocket 3',
    badge: 'RECOMMANDÉ',
    badgeColor: colors.accent,
    description:
      "Sortie BOOTH ou REC de ta table de mix → câble TRS 3.5mm → entrée mic de l'Osmo. Son ultra-propre, zéro latence.",
    steps: [
      "Branche un câble TRS 3.5mm sur la sortie BOOTH ou REC de ta table de mix",
      "Connecte l'autre extrémité à l'entrée mic de l'Osmo Pocket 3",
      "Règle le volume de sortie de la table à 30–40% max pour éviter la saturation",
      "Dans DJI Mimo, onglet Live → vérifie le niveau audio dans les réglages",
    ],
    warning:
      "La sortie ligne d'une table de mix est bien plus forte qu'un micro. Commence à 30% et monte doucement.",
  },
  {
    id: 'usb-interface',
    icon: 'hardware-chip-outline',
    label: 'Interface audio USB → iPhone',
    badge: 'STUDIO',
    badgeColor: '#22c55e',
    description:
      "Table de mix → Interface audio USB (ex: Focusrite Scarlett Solo) → iPhone via hub USB-C. iOS la détecte automatiquement.",
    steps: [
      "Branche ta table de mix sur l'entrée de l'interface audio (XLR ou jack 6.35mm)",
      "Connecte l'interface à ton iPhone via un hub USB-C (avec alimentation)",
      "iOS détecte l'interface automatiquement — aucun driver requis",
      "Lance le test ci-dessous pour confirmer le signal",
    ],
  },
  {
    id: 'builtin',
    icon: 'mic-outline',
    label: 'Micro intégré iPhone / Osmo',
    badge: 'TEST SEULEMENT',
    badgeColor: colors.textMuted,
    description:
      "Qualité insuffisante pour un live DJ professionnel. Utilise cette option uniquement pour tester l'app.",
    steps: [
      "Aucune connexion requise",
      "Positionne le téléphone à 50–80 cm des enceintes pour capter le son",
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AudioCheckScreen() {
  const navigation = useNavigation<any>();
  const [selectedSource, setSelectedSource] = useState<AudioSourceId>('mixer-osmo');
  const [isTesting, setIsTesting] = useState(false);
  const [signalDetected, setSignalDetected] = useState(false);
  const meterAnim = useRef(new Animated.Value(0)).current;

  // expo-audio hook — statusListener fires on each metering update
  const recorder = useAudioRecorder(
    { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true },
    (status) => {
      if (!status.isRecording || status.metering === undefined) return;
      // metering: -160 to 0 dBFS — map -60..0 to 0..1
      const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
      Animated.timing(meterAnim, {
        toValue: normalized,
        duration: 80,
        useNativeDriver: false,
      }).start();
      if (normalized > 0.04) setSignalDetected(true);
    },
  );

  const stopTest = useCallback(async () => {
    try {
      await recorder.stop();
    } catch {}
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: false });
    } catch {}
    setIsTesting(false);
    Animated.timing(meterAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  }, [recorder, meterAnim]);

  async function startTest() {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permission refusée',
          "L'accès au micro est nécessaire pour tester le niveau audio.",
        );
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsTesting(true);
      setSignalDetected(false);
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible d'accéder au micro. Vérifie les permissions dans les réglages iOS.",
      );
    }
  }

  function handleSelectSource(id: AudioSourceId) {
    if (isTesting) stopTest();
    setSelectedSource(id);
    setSignalDetected(false);
  }

  const selectedOption = AUDIO_OPTIONS.find((o) => o.id === selectedSource)!;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.title}>
        {'ENTRÉE '}
        <Text style={styles.titleAccent}>AUDIO</Text>
      </Text>
      <Text style={styles.subtitle}>
        Choisis comment connecter ta table de mix avant de streamer.
      </Text>

      {/* Audio source cards */}
      {AUDIO_OPTIONS.map((option) => {
        const isSelected = option.id === selectedSource;
        return (
          <Pressable
            key={option.id}
            onPress={() => handleSelectSource(option.id)}
            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIconWrap, isSelected && styles.optionIconWrapSelected]}>
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={isSelected ? colors.white : colors.textMuted}
                />
              </View>
              <View style={styles.optionInfo}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: option.badgeColor + '22' }]}>
                    <Text style={[styles.badgeText, { color: option.badgeColor }]}>
                      {option.badge}
                    </Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
            </View>

            {/* Steps — only shown when selected */}
            {isSelected && (
              <View style={styles.stepsContainer}>
                {option.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepNumberCircle}>
                      <Text style={styles.stepNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
                {option.warning && (
                  <View style={styles.warningBox}>
                    <Ionicons name="warning-outline" size={15} color={colors.warning} />
                    <Text style={styles.warningText}>{option.warning}</Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        );
      })}

      {/* VU-meter section */}
      <View style={styles.vuSection}>
        <Text style={styles.vuTitle}>Test du niveau audio</Text>
        <Text style={styles.vuSubtitle}>
          Vérifie que le signal arrive bien dans l'app avant de passer à la caméra.
        </Text>

        {/* Meter bar */}
        <View style={styles.meterTrack}>
          <Animated.View
            style={[
              styles.meterFill,
              {
                width: meterAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: meterAnim.interpolate({
                  inputRange: [0, 0.6, 0.85, 1],
                  outputRange: [colors.accent, colors.accentLight, '#22c55e', '#ef4444'],
                }),
              },
            ]}
          />
          <View style={styles.meterScale}>
            {['-∞', '-20', '-10', '-6', '0'].map((label, i) => (
              <Text key={i} style={styles.meterScaleLabel}>{label}</Text>
            ))}
          </View>
        </View>

        {/* Signal indicator */}
        <View style={styles.signalRow}>
          <View
            style={[
              styles.signalDot,
              isTesting && signalDetected && styles.signalDotActive,
              isTesting && !signalDetected && styles.signalDotWaiting,
            ]}
          />
          <Text style={[styles.signalText, isTesting && signalDetected && styles.signalTextActive]}>
            {!isTesting
              ? 'Appuie sur "Tester" pour vérifier ton signal'
              : signalDetected
              ? 'Signal détecté — niveau correct'
              : 'En écoute... joue quelque chose sur ta table'}
          </Text>
        </View>

        {/* Test button */}
        <Pressable
          onPress={isTesting ? stopTest : startTest}
          style={[styles.testButton, isTesting && styles.testButtonStop]}
        >
          <Ionicons
            name={isTesting ? 'stop-circle-outline' : 'mic-outline'}
            size={18}
            color={colors.white}
          />
          <Text style={styles.testButtonText}>
            {isTesting ? 'Arrêter le test' : 'Tester le niveau'}
          </Text>
        </Pressable>
      </View>

      {/* Continue button */}
      <Pressable
        onPress={() => navigation.navigate('QuickStream')}
        style={styles.continueButton}
      >
        <Text style={styles.continueButtonText}>Configurer la caméra →</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  titleAccent: {
    color: colors.accent,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  optionCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionCardSelected: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}10`,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionIconWrapSelected: {
    backgroundColor: colors.accent,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  optionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.sm,
  },
  optionLabelSelected: {
    color: colors.textPrimary,
  },
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: fonts.body.medium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  optionDescription: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  stepsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${colors.accent}30`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: 11,
  },
  stepText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: `${colors.warning}12`,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.warning}25`,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  warningText: {
    flex: 1,
    color: colors.warning,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  vuSection: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  vuTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  vuSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    marginBottom: spacing.md,
  },
  meterTrack: {
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    position: 'relative',
  },
  meterFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: borderRadius.sm,
  },
  meterScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    height: '100%',
    alignItems: 'center',
  },
  meterScaleLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: fonts.mono.regular,
    fontSize: 9,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 20,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  signalDotActive: {
    backgroundColor: '#22c55e',
  },
  signalDotWaiting: {
    backgroundColor: colors.warning,
  },
  signalText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    flex: 1,
  },
  signalTextActive: {
    color: '#22c55e',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
  },
  testButtonStop: {
    backgroundColor: 'rgba(239,68,68,0.8)',
  },
  testButtonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  continueButton: {
    backgroundColor: colors.accent,
    borderRadius: 100,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueButtonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 1,
  },
});
