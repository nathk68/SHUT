import React, { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { copyToClipboard } from '../../utils/clipboard';
import { getStoredData, setStoredData, removeStoredData } from '../../utils/storage';
import { streamingService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

// ─── Camera guide data ─────────────────────────────────────────────────────────

type GuideStep = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
};

interface CameraGuide {
  title: string;
  subtitle: string;
  steps: GuideStep[];
}

const DJI_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'phone-portrait-outline', 'radio-outline', 'code-slash-outline',
  'copy-outline', 'volume-high-outline', 'play-circle-outline',
];
const LARIX_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'download-outline', 'settings-outline', 'copy-outline',
  'volume-high-outline', 'videocam-outline', 'play-circle-outline',
];
const GOPRO_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'cloud-download-outline', 'copy-outline', 'qr-code-outline',
  'camera-outline', 'play-circle-outline',
];

const STEP_KEYS: Record<string, { key: string; icons: (keyof typeof Ionicons.glyphMap)[] }> = {
  'dji-pocket-3': { key: 'djiSteps', icons: DJI_ICONS },
  'dji-pocket-2': { key: 'djiSteps', icons: DJI_ICONS },
  'dji-action-4': { key: 'djiSteps', icons: DJI_ICONS },
  'dji-action-3': { key: 'djiSteps', icons: DJI_ICONS },
  'iphone':       { key: 'larixSteps', icons: LARIX_ICONS },
  'gopro':        { key: 'goproSteps', icons: GOPRO_ICONS },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickStreamScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { recordLives } = usePreferences();
  const cameraId: string | undefined = route.params?.cameraId;

  const stepConfig = cameraId ? STEP_KEYS[cameraId] : undefined;
  const stepsKey = stepConfig?.key ?? 'djiSteps';
  const stepsIcons = stepConfig?.icons ?? DJI_ICONS;
  const rawSteps = t(`broadcaster.quickStream.${stepsKey}`, { returnObjects: true }) as { title: string; desc: string }[];
  const guideSteps: GuideStep[] = rawSteps.map((s, i) => ({ ...s, icon: stepsIcons[i] ?? 'ellipse-outline' }));

  const guideInfo = cameraId
    ? { title: t(`broadcaster.quickStream.guides.${cameraId}.title`, { defaultValue: '' }), subtitle: t(`broadcaster.quickStream.guides.${cameraId}.subtitle`, { defaultValue: '' }) }
    : null;
  const guide: CameraGuide = {
    title: guideInfo?.title || t('broadcaster.quickStream.defaultGuide.title'),
    subtitle: guideInfo?.subtitle || t('broadcaster.quickStream.defaultGuide.subtitle'),
    steps: guideSteps,
  };
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [rtmpUrl, setRtmpUrl] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedField, setCopiedField] = useState<'full' | 'url' | 'key' | null>(null);

  // Restore saved credentials on mount
  useEffect(() => {
    getStoredData<{ eventId: string; rtmpUrl: string; streamKey: string }>('@shut_quick_stream')
      .then((saved) => {
        if (saved) {
          setEventId(saved.eventId);
          setRtmpUrl(saved.rtmpUrl);
          setStreamKey(saved.streamKey);
        }
      })
      .catch(() => {});
  }, []);

  const fullUrl = rtmpUrl && streamKey ? `${rtmpUrl}/${streamKey}` : null;
  const maskedKey = streamKey ? streamKey.replace(/./g, '\u2022').substring(0, 20) + '...' : '';

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const creds = await streamingService.startQuickStream(user?.id ?? 'anonymous', { record: recordLives });
      setEventId(creds.eventId);
      setRtmpUrl(creds.rtmpUrl);
      setStreamKey(creds.streamKey);
      setShowKey(false);
      await setStoredData('@shut_quick_stream', {
        eventId: creds.eventId,
        rtmpUrl: creds.rtmpUrl,
        streamKey: creds.streamKey,
      });
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? t('broadcaster.quickStream.generateError'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, recordLives]);

  async function handleCopyFull() {
    if (!fullUrl) return;
    try { await copyToClipboard(fullUrl); } catch {}
    setCopiedField('full');
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleCopyUrl() {
    if (!rtmpUrl) return;
    try { await copyToClipboard(rtmpUrl); } catch {}
    setCopiedField('url');
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleCopyKey() {
    if (!streamKey) return;
    try { await copyToClipboard(streamKey); } catch {}
    setCopiedField('key');
    setTimeout(() => setCopiedField(null), 2000);
  }

  const hasCredentials = !!rtmpUrl && !!streamKey;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.title}>
        {t('broadcaster.quickStream.headerTitle')}
        <Text style={styles.titleAccent}>{t('broadcaster.quickStream.headerAccent')}</Text>
      </Text>
      <Text style={styles.subtitle}>{guide.subtitle}</Text>

      {/* Generate credentials card */}
      {!hasCredentials ? (
        <View style={styles.generateCard}>
          <View style={styles.generateIcon}>
            <Ionicons name="key-outline" size={32} color={colors.accentLight} />
          </View>
          <Text style={styles.generateTitle}>{t('broadcaster.quickStream.generateTitle')}</Text>
          <Text style={styles.generateDesc}>
            {t('broadcaster.quickStream.generateDesc')}
          </Text>
          <Pressable
            onPress={handleGenerate}
            disabled={loading}
            style={[styles.generateButton, loading && styles.generateButtonLoading]}
          >
            <Ionicons name="flash-outline" size={18} color={colors.white} />
            <Text style={styles.generateButtonText}>
              {loading ? t('broadcaster.quickStream.generating') : t('broadcaster.quickStream.generateButton')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Credentials */}
          <Text style={styles.sectionLabel}>{t('broadcaster.quickStream.credentialsSection')}</Text>

          {/* Full URL (for DJI Mimo) */}
          <View style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <View style={styles.credentialLabelRow}>
                <Ionicons name="videocam-outline" size={14} color={colors.accentLight} />
                <Text style={styles.credentialLabel}>{t('broadcaster.quickStream.fullUrlLabel')}</Text>
              </View>
              <Pressable onPress={handleCopyFull} style={styles.copyBtn}>
                <Ionicons name={copiedField === 'full' ? 'checkmark' : 'copy-outline'} size={14} color={colors.accentLight} />
                <Text style={styles.copyBtnText}>{copiedField === 'full' ? t('broadcaster.quickStream.copied') : t('broadcaster.quickStream.copy')}</Text>
              </Pressable>
            </View>
            <Text style={styles.credentialValue} selectable>
              {fullUrl}
            </Text>
          </View>

          {/* RTMP URL */}
          <View style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <View style={styles.credentialLabelRow}>
                <Ionicons name="link-outline" size={14} color={colors.textMuted} />
                <Text style={styles.credentialLabel}>{t('broadcaster.quickStream.rtmpUrlLabel')}</Text>
              </View>
              <Pressable onPress={handleCopyUrl} style={styles.copyBtn}>
                <Ionicons name={copiedField === 'url' ? 'checkmark' : 'copy-outline'} size={14} color={colors.accentLight} />
                <Text style={styles.copyBtnText}>{copiedField === 'url' ? t('broadcaster.quickStream.copied') : t('broadcaster.quickStream.copy')}</Text>
              </Pressable>
            </View>
            <Text style={styles.credentialValue} selectable>
              {rtmpUrl}
            </Text>
          </View>

          {/* Stream key */}
          <View style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <View style={styles.credentialLabelRow}>
                <Ionicons name="key-outline" size={14} color={colors.textMuted} />
                <Text style={styles.credentialLabel}>{t('broadcaster.quickStream.streamKeyLabel')}</Text>
              </View>
              <View style={styles.credentialActions}>
                <Pressable onPress={() => setShowKey((v) => !v)} style={styles.iconBtn}>
                  <Ionicons
                    name={showKey ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>
                <Pressable onPress={handleCopyKey} style={styles.copyBtn}>
                  <Ionicons name={copiedField === 'key' ? 'checkmark' : 'copy-outline'} size={14} color={colors.accentLight} />
                  <Text style={styles.copyBtnText}>{copiedField === 'key' ? t('broadcaster.quickStream.copied') : t('broadcaster.quickStream.copy')}</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.credentialValue} selectable={showKey}>
              {showKey ? streamKey : maskedKey}
            </Text>
          </View>
        </>
      )}

      {/* Camera-specific guide */}
      <View style={styles.guideCard}>
        <View style={styles.guideHeader}>
          <Ionicons name="videocam-outline" size={18} color={colors.accentLight} />
          <Text style={styles.guideTitle}>{guide.title}</Text>
        </View>
        <Text style={styles.guideSubtitle}>
          {t('broadcaster.quickStream.guideFollowSteps')}
        </Text>

        {guide.steps.map((step, i) => (
          <View key={i} style={styles.guideStep}>
            <View style={styles.guideStepLeft}>
              <View style={styles.guideStepNumber}>
                <Text style={styles.guideStepNumberText}>{i + 1}</Text>
              </View>
              {i < guide.steps.length - 1 && <View style={styles.guideStepLine} />}
            </View>
            <View style={styles.guideStepContent}>
              <View style={styles.guideStepTitleRow}>
                <Ionicons name={step.icon} size={15} color={colors.accentLight} />
                <Text style={styles.guideStepTitle}>{step.title}</Text>
              </View>
              <Text style={styles.guideStepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Audio reminder */}
      <View style={styles.audioReminderCard}>
        <Ionicons name="musical-notes-outline" size={16} color={colors.warning} />
        <Text style={styles.audioReminderText}>
          {t('broadcaster.quickStream.audioReminder')}
        </Text>
      </View>

      {/* Phone camera CTA */}
      {hasCredentials && (
        <Pressable
          onPress={() => navigation.navigate('PhoneCamera', { rtmpUrl, streamKey, eventId: eventId ?? undefined })}
          style={styles.phoneCameraButton}
        >
          <View style={styles.phoneCameraButtonLeft}>
            <View style={styles.phoneCameraIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.phoneCameraTitle}>{t('broadcaster.quickStream.phoneCameraTitle')}</Text>
              <Text style={styles.phoneCameraDesc}>{t('broadcaster.quickStream.phoneCameraDesc')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      )}

      {/* CTA */}
      {hasCredentials && (
        <Pressable
          onPress={() => navigation.navigate('PhoneCamera', { rtmpUrl, streamKey, eventId: eventId ?? undefined, mode: 'external' })}
          style={styles.goLiveButton}
        >
          <Ionicons name="radio-outline" size={20} color={colors.white} />
          <Text style={styles.goLiveButtonText}>{t('broadcaster.quickStream.goLive')}</Text>
        </Pressable>
      )}

      {/* Regenerate */}
      {hasCredentials && (
        <Pressable
          onPress={async () => {
            await removeStoredData('@shut_quick_stream');
            setEventId(null);
            setRtmpUrl(null);
            setStreamKey(null);
          }}
          style={styles.regenerateButton}
        >
          <Ionicons name="refresh-outline" size={15} color={colors.textMuted} />
          <Text style={styles.regenerateText}>{t('broadcaster.quickStream.regenerate')}</Text>
        </Pressable>
      )}
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

  // ── Generate card ─────────────────────────────────────────────────────────
  generateCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  generateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.accent}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  generateTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  generateDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  generateButtonLoading: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 0.5,
  },

  // ── Credentials ───────────────────────────────────────────────────────────
  sectionLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
  },
  credentialCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  credentialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  credentialLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  credentialLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credentialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.accentLight}18`,
    borderRadius: borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  copyBtnText: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
  },
  iconBtn: {
    padding: 4,
  },
  credentialValue: {
    color: colors.textPrimary,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
    lineHeight: 18,
  },

  // ── DJI guide ─────────────────────────────────────────────────────────────
  guideCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  guideTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
  },
  guideSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    marginBottom: spacing.md,
  },
  guideStep: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  guideStepLeft: {
    alignItems: 'center',
    width: 24,
  },
  guideStepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${colors.accent}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideStepNumberText: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: 10,
  },
  guideStepLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 3,
  },
  guideStepContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  guideStepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  guideStepTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
  },
  guideStepDesc: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },

  // ── Audio reminder ────────────────────────────────────────────────────────
  audioReminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.warning}10`,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.warning}25`,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  audioReminderText: {
    flex: 1,
    color: colors.warning,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },

  // ── CTA buttons ───────────────────────────────────────────────────────────
  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: 100,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  goLiveButtonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 1,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  regenerateText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },

  // ── Phone camera button ────────────────────────────────────────────────────
  phoneCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  phoneCameraButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  phoneCameraIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.accent}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneCameraTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    marginBottom: 2,
  },
  phoneCameraDesc: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
});
