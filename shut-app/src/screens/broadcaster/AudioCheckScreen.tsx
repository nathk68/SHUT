import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

// ─── Audio source options ──────────────────────────────────────────────────────

type AudioSourceId = 'mixer-camera' | 'usb-interface' | 'builtin';

interface AudioOption {
  id: AudioSourceId;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  steps?: string[];
  warning?: string;
}

const AUDIO_OPTIONS: AudioOption[] = [
  {
    id: 'mixer-camera',
    icon: 'videocam-outline',
    label: 'Table de mix → Caméra',
    badge: 'RECOMMANDÉ',
    badgeColor: colors.accent,
    description:
      "Connecte la sortie BOOTH ou REC de ta table à ta caméra. Choisis ton modèle ci-dessous pour le tutoriel complet.",
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
    label: 'Micro intégré iPhone',
    description:
      "Qualité insuffisante pour un live DJ professionnel. Utilise cette option uniquement pour tester l'app.",
    steps: [
      "Aucune connexion requise",
      "Positionne le téléphone à 50–80 cm des enceintes pour capter le son",
    ],
  },
];

// ─── Camera configs ────────────────────────────────────────────────────────────

interface CameraConfig {
  id: string;
  name: string;
  brand: string;
  icon: keyof typeof Ionicons.glyphMap;
  compatible: boolean;
  incompatibleReason?: string;
  appName?: string;
  steps?: string[];
  warning?: string;
}

const CAMERAS: CameraConfig[] = [
  {
    id: 'dji-pocket-3',
    name: 'Osmo Pocket 3',
    brand: 'DJI',
    icon: 'videocam-outline',
    compatible: true,
    appName: 'DJI Mimo',
    steps: [
      "Branche un câble TRS 3.5mm sur la sortie BOOTH ou REC de ta table de mix",
      "Connecte l'autre extrémité à l'entrée mic de l'Osmo Pocket 3",
      "Règle le volume de sortie à 30–40% pour éviter la saturation",
      "Ouvre DJI Mimo → onglet Live → \"RTMP personnalisé\"",
      "Colle l'URL complète SHUT dans le champ RTMP, puis démarre",
    ],
    warning: "La sortie ligne est bien plus forte qu'un micro. Commence à 30% et monte doucement.",
  },
  {
    id: 'dji-pocket-2',
    name: 'Osmo Pocket 2',
    brand: 'DJI',
    icon: 'videocam-outline',
    compatible: true,
    appName: 'DJI Mimo',
    steps: [
      "Branche un câble TRS 3.5mm sur la sortie BOOTH ou REC de ta table de mix",
      "Connecte l'autre extrémité à l'entrée mic de l'Osmo Pocket 2",
      "Règle le volume de sortie à 30–40% pour éviter la saturation",
      "Ouvre DJI Mimo → onglet Live → \"RTMP personnalisé\"",
      "Colle l'URL complète SHUT dans le champ RTMP, puis démarre",
    ],
    warning: "Commence à 30% et monte doucement pour éviter la saturation.",
  },
  {
    id: 'dji-action-4',
    name: 'Osmo Action 4',
    brand: 'DJI',
    icon: 'videocam-outline',
    compatible: true,
    appName: 'DJI Mimo',
    steps: [
      "Connecte la sortie BOOTH/REC de ta table sur l'entrée micro de l'Action 4",
      "Ouvre DJI Mimo → onglet Live → \"RTMP personnalisé\"",
      "Colle l'URL complète SHUT dans le champ RTMP",
      "Vérifie le niveau audio dans les réglages Mimo, puis démarre",
    ],
  },
  {
    id: 'dji-action-3',
    name: 'Osmo Action 3',
    brand: 'DJI',
    icon: 'videocam-outline',
    compatible: true,
    appName: 'DJI Mimo',
    steps: [
      "Connecte la sortie BOOTH/REC de ta table sur l'entrée micro de l'Action 3",
      "Ouvre DJI Mimo → onglet Live → \"RTMP personnalisé\"",
      "Colle l'URL complète SHUT dans le champ RTMP",
      "Vérifie le niveau audio dans les réglages Mimo, puis démarre",
    ],
  },
  {
    id: 'iphone',
    name: 'iPhone (caméra)',
    brand: 'Apple',
    icon: 'phone-portrait-outline',
    compatible: true,
    appName: 'Larix Broadcaster',
    steps: [
      "Installe Larix Broadcaster sur un 2ème iPhone (App Store, gratuit)",
      "Branche la sortie BOOTH/REC de ta table sur l'entrée jack de l'iPhone (adaptateur requis)",
      "Dans Larix : Réglages → Connexions → + → colle l'URL RTMP complète SHUT",
      "Sélectionne la caméra et la source audio (entrée jack), puis démarre",
    ],
    warning: "L'entrée jack et la charge USB-C/Lightning ne sont pas simultanées. Pense à charger le téléphone avant.",
  },
  {
    id: 'gopro',
    name: 'Hero 9 / 10 / 11 / 12 / 13',
    brand: 'GoPro',
    icon: 'camera-outline',
    compatible: true,
    appName: 'GoPro Labs',
    steps: [
      "Télécharge le firmware GoPro Labs sur gopro.com/labs (gratuit, officiel)",
      "Installe-le sur ta GoPro via la carte SD selon les instructions du site",
      "Génère ton URL RTMP SHUT dans l'écran suivant",
      "Ouvre l'app GoPro Quik → Labs QR → génère un QR code avec ton URL RTMP",
      "Sur la GoPro : maintiens le bouton Mode → scanne le QR code avec l'appareil",
      "Démarre le live depuis la GoPro — elle stream vers SHUT",
    ],
    warning: "GoPro Labs est un firmware expérimental officiel. Il ne couvre pas les modèles Hero 8 et antérieurs.",
  },
  {
    id: 'sony',
    name: 'Sony ZV-1 / ZV-E10',
    brand: 'Sony',
    icon: 'camera-outline',
    compatible: false,
    incompatibleReason: "Les appareils Sony ne proposent pas de streaming RTMP vers des serveurs tiers. Non compatible avec SHUT.",
  },
  {
    id: 'dslr',
    name: 'Reflex / Hybride (Canon, Nikon…)',
    brand: 'Autre',
    icon: 'camera-outline',
    compatible: false,
    incompatibleReason: "Les appareils photo ne supportent généralement pas le streaming RTMP direct. Tu peux utiliser un PC avec OBS entre les deux.",
  },
];

// ─── Recording options with explicit metering interval ────────────────────────

// meteringIntervalMillis forces the native module to emit metering events
const RECORDING_OPTIONS: any = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  android: { ...RecordingPresets.HIGH_QUALITY.android, meteringIntervalMillis: 80 },
  ios: { ...RecordingPresets.HIGH_QUALITY.ios, meteringIntervalMillis: 80 },
};

function formatInputLabel(input: { name: string; type?: string } | undefined): string {
  if (!input) return 'Micro intégré iPhone';
  const t = (input.type ?? '').toLowerCase();
  if (t.includes('usb')) return `Interface USB · ${input.name}`;
  if (t.includes('bluetooth')) return `Bluetooth · ${input.name}`;
  if (t.includes('wired') || t.includes('headset')) return `Micro filaire · ${input.name}`;
  if (t.includes('builtin') || t.includes('built')) return 'Micro intégré iPhone';
  return input.name;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AudioCheckScreen() {
  const navigation = useNavigation<any>();
  const [selectedSource, setSelectedSource] = useState<AudioSourceId>('mixer-camera');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraPickerOpen, setCameraPickerOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [signalDetected, setSignalDetected] = useState(false);
  const [activeInputLabel, setActiveInputLabel] = useState('Micro intégré iPhone');
  const meterAnim = useRef(new Animated.Value(0)).current;

  // ─── VU meter ───────────────────────────────────────────────────────────────

  const recorder = useAudioRecorder(RECORDING_OPTIONS);

  // useAudioRecorderState polls the native recorder at the given interval (ms)
  // and returns a fresh RecordingStatus including metering
  const recorderState = useAudioRecorderState(recorder, 80);

  useEffect(() => {
    if (!isTesting || !recorderState.isRecording || recorderState.metering === undefined) return;
    const normalized = Math.max(0, Math.min(1, (recorderState.metering + 60) / 60));
    Animated.timing(meterAnim, { toValue: normalized, duration: 80, useNativeDriver: false }).start();
    if (normalized > 0.04) setSignalDetected(true);
  }, [isTesting, recorderState, meterAnim]);

  const stopTest = useCallback(async () => {
    try { await recorder.stop(); } catch {}
    try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: false }); } catch {}
    setIsTesting(false);
    Animated.timing(meterAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  }, [recorder, meterAnim]);

  async function startTest() {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission refusée', "L'accès au micro est nécessaire pour tester le niveau audio.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();

      // Detect active audio input via native audio session
      try {
        const input = (recorder as any).getCurrentInput?.();
        setActiveInputLabel(formatInputLabel(input));
      } catch {}

      recorder.record();
      setIsTesting(true);
      setSignalDetected(false);
    } catch {
      Alert.alert('Erreur', "Impossible d'accéder au micro. Vérifie les permissions dans les réglages iOS.");
    }
  }

  // ─── Event handlers ─────────────────────────────────────────────────────────

  function handleSelectSource(id: AudioSourceId) {
    if (isTesting) stopTest();
    setSelectedSource(id);
    setSignalDetected(false);
    if (id !== 'mixer-camera') {
      setSelectedCameraId(null);
      setCameraPickerOpen(false);
    }
  }

  function handleSelectCamera(cameraId: string) {
    setSelectedCameraId(cameraId);
    setCameraPickerOpen(false);
  }

  // ─── Derived values ──────────────────────────────────────────────────────────

  const selectedCamera = selectedCameraId ? CAMERAS.find((c) => c.id === selectedCameraId) : null;
  const canContinue = selectedSource !== 'mixer-camera' || selectedCamera?.compatible === true;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Entrée audio"
        subtitle="Choisis comment connecter ta table de mix avant de streamer."
      />

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

            {/* Camera picker — only for mixer-camera when selected */}
            {isSelected && option.id === 'mixer-camera' && (
              <View style={styles.stepsContainer}>
                <Text style={styles.cameraPickerLabel}>Ta caméra</Text>

                {/* Dropdown trigger */}
                <Pressable
                  onPress={() => setCameraPickerOpen((v) => !v)}
                  style={styles.cameraPickerRow}
                >
                  <View style={styles.cameraPickerLeft}>
                    <Ionicons
                      name={selectedCamera ? selectedCamera.icon : 'camera-outline'}
                      size={15}
                      color={selectedCamera ? colors.accentLight : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.cameraPickerValue,
                        !selectedCamera && styles.cameraPickerPlaceholder,
                      ]}
                    >
                      {selectedCamera
                        ? `${selectedCamera.brand} ${selectedCamera.name}`
                        : 'Sélectionne ta caméra'}
                    </Text>
                  </View>
                  <Ionicons
                    name={cameraPickerOpen ? 'chevron-up' : 'chevron-down'}
                    size={15}
                    color={colors.textMuted}
                  />
                </Pressable>

                {/* Inline camera list */}
                {cameraPickerOpen && (
                  <View style={styles.cameraList}>
                    {CAMERAS.map((cam) => (
                      <Pressable
                        key={cam.id}
                        onPress={() => handleSelectCamera(cam.id)}
                        style={[
                          styles.cameraListItem,
                          selectedCameraId === cam.id && styles.cameraListItemSelected,
                        ]}
                      >
                        <View style={styles.cameraListItemLeft}>
                          <Ionicons
                            name={cam.icon}
                            size={14}
                            color={cam.compatible ? colors.textSecondary : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.cameraListItemName,
                              !cam.compatible && styles.cameraListItemNameMuted,
                            ]}
                          >
                            {cam.brand} {cam.name}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.compatBadge,
                            { backgroundColor: cam.compatible ? '#22c55e22' : '#ef444422' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.compatBadgeText,
                              { color: cam.compatible ? '#22c55e' : '#ef4444' },
                            ]}
                          >
                            {cam.compatible ? '✓' : '✗'}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Tutorial or incompatible message for selected camera */}
                {selectedCamera && !cameraPickerOpen && (
                  selectedCamera.compatible ? (
                    <View style={styles.cameraTutorial}>
                      {selectedCamera.appName && (
                        <View style={styles.cameraTutorialHeader}>
                          <Ionicons name="phone-portrait-outline" size={13} color={colors.accentLight} />
                          <Text style={styles.cameraTutorialHeaderText}>
                            App requise : {selectedCamera.appName}
                          </Text>
                        </View>
                      )}
                      {selectedCamera.steps!.map((step, i) => (
                        <View key={i} style={styles.stepRow}>
                          <View style={styles.stepNumberCircle}>
                            <Text style={styles.stepNumberText}>{i + 1}</Text>
                          </View>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                      {selectedCamera.warning && (
                        <View style={styles.warningBox}>
                          <Ionicons name="warning-outline" size={15} color={colors.warning} />
                          <Text style={styles.warningText}>{selectedCamera.warning}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.incompatibleBox}>
                      <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                      <View style={styles.incompatibleContent}>
                        <Text style={styles.incompatibleTitle}>Désolé, pas compatible</Text>
                        <Text style={styles.incompatibleText}>{selectedCamera.incompatibleReason}</Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            )}

            {/* Steps for non-camera options */}
            {isSelected && option.id !== 'mixer-camera' && option.steps && (
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

      {/* Active audio input indicator */}
      <View style={styles.activeInputBanner}>
        <Ionicons
          name="mic-outline"
          size={13}
          color={isTesting && signalDetected ? '#22c55e' : colors.textMuted}
        />
        <Text
          style={[
            styles.activeInputText,
            isTesting && signalDetected && styles.activeInputTextConfirmed,
          ]}
        >
          {isTesting && signalDetected
            ? `Signal confirmé · ${activeInputLabel}`
            : `Entrée active : ${activeInputLabel}`}
        </Text>
      </View>

      {/* VU-meter section — désactivé temporairement
      <View style={styles.vuSection}>
        <Text style={styles.vuTitle}>Test du niveau audio</Text>
        <Text style={styles.vuSubtitle}>
          Vérifie que le signal arrive bien dans l'app avant de passer à la caméra.
        </Text>

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
      */}

      {/* Continue button */}
      <Pressable
        onPress={() => {
          if (!canContinue) {
            Alert.alert(
              'Caméra incompatible',
              "Cette caméra n'est pas compatible avec SHUT. Choisis une autre caméra ou une autre option audio.",
            );
            return;
          }
          navigation.navigate('QuickStream', { cameraId: selectedCameraId ?? undefined });
        }}
        style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
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
  // ── Camera picker ────────────────────────────────────────────────────────────
  cameraPickerLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  cameraPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  cameraPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cameraPickerValue: {
    color: colors.textPrimary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
  },
  cameraPickerPlaceholder: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
  },
  cameraList: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cameraListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cameraListItemSelected: {
    backgroundColor: `${colors.accent}18`,
  },
  cameraListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cameraListItemName: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  cameraListItemNameMuted: {
    color: colors.textMuted,
  },
  compatBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatBadgeText: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
  },
  // ── Camera tutorial ──────────────────────────────────────────────────────────
  cameraTutorial: {
    gap: spacing.sm,
  },
  cameraTutorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  cameraTutorialHeaderText: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
  },
  // ── Incompatible ─────────────────────────────────────────────────────────────
  incompatibleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#ef444412',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#ef444425',
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  incompatibleContent: {
    flex: 1,
  },
  incompatibleTitle: {
    color: '#ef4444',
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    marginBottom: 2,
  },
  incompatibleText: {
    color: '#ef444499',
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  // ── Steps (shared) ───────────────────────────────────────────────────────────
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
  // ── Active input indicator ────────────────────────────────────────────────────
  activeInputBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  activeInputText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  activeInputTextConfirmed: {
    color: '#22c55e',
  },
  // ── VU meter ─────────────────────────────────────────────────────────────────
  vuSection: {
    marginTop: spacing.sm,
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
  // ── Continue button ───────────────────────────────────────────────────────────
  continueButton: {
    backgroundColor: colors.accent,
    borderRadius: 100,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 1,
  },
});
