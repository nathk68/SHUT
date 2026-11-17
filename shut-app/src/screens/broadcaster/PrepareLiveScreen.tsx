import React, { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { streamingService, userService } from '../../services';
import { copyToClipboard } from '../../utils/clipboard';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type VideoSource = 'smartphone' | 'external';
type AudioSource = 'audio-interface' | 'usb-direct';
type Step = 1 | 2;

// ─── Component ───────────────────────────────────────────────────────────────

export function PrepareLiveScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { recordLives } = usePreferences();

  const [step, setStep] = useState<Step>(1);
  const [videoSource, setVideoSource] = useState<VideoSource>('smartphone');
  const [audioSource, setAudioSource] = useState<AudioSource>('audio-interface');

  // ── RTMP credentials (for external camera) ──────────────────────────────
  const [rtmpUrl, setRtmpUrl] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [generatingCreds, setGeneratingCreds] = useState(false);
  const [copiedField, setCopiedField] = useState<'full' | 'url' | 'key' | null>(null);
  const [launching, setLaunching] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  const hasCredentials = !!rtmpUrl && !!streamKey;
  const fullUrl = rtmpUrl && streamKey ? `${rtmpUrl}/${streamKey}` : null;
  const maskedKey = streamKey ? streamKey.replace(/./g, '\u2022').substring(0, 20) + '...' : '';

  // Load existing credentials on focus
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      userService.getUserById(user.id).then((u) => {
        if (u?.muxStreamKey) {
          setStreamKey(u.muxStreamKey);
          setRtmpUrl('rtmp://global-live.mux.com:5222/app');
        }
      }).catch(() => {});
    }, [user?.id]),
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleGenerateCredentials = useCallback(async () => {
    setGeneratingCreds(true);
    try {
      const creds = await streamingService.ensurePermanentStream();
      setRtmpUrl(creds.rtmpUrl);
      setStreamKey(creds.streamKey);
      setShowKey(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? t('prepareLive.generateError'));
    } finally {
      setGeneratingCreds(false);
    }
  }, [t]);

  const handleCopy = useCallback(async (field: 'full' | 'url' | 'key') => {
    const text = field === 'full' ? fullUrl : field === 'url' ? rtmpUrl : streamKey;
    if (!text) return;
    try { await copyToClipboard(text); } catch {}
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, [fullUrl, rtmpUrl, streamKey]);

  const handleLaunchLive = useCallback(async () => {
    // For external camera: need credentials
    if (videoSource === 'external' && !hasCredentials) {
      Alert.alert(t('prepareLive.credentialsRequired'), t('prepareLive.credentialsRequiredDesc'));
      return;
    }
    setLaunching(true);
    try {
      // Ensure credentials exist before starting
      if (!hasCredentials) {
        const creds = await streamingService.ensurePermanentStream();
        setRtmpUrl(creds.rtmpUrl);
        setStreamKey(creds.streamKey);
      }
      const mode = videoSource === 'external' ? 'external' : undefined;
      const creds = await streamingService.startQuickStream(user?.id ?? 'anonymous', { record: recordLives });
      navigation.navigate('PhoneCamera', {
        rtmpUrl: creds.rtmpUrl,
        streamKey: creds.streamKey,
        eventId: creds.eventId,
        ...(mode ? { mode } : {}),
      });
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? t('prepareLive.launchError'));
    } finally {
      setLaunching(false);
    }
  }, [videoSource, hasCredentials, user?.id, recordLives, navigation, t]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <Text style={styles.headerTitle}>{t('prepareLive.title')}</Text>

        {/* ── Step indicator (clickable) ─────────────────────────────────── */}
        <View style={styles.stepsRow}>
          <Pressable style={styles.stepItem} onPress={() => setStep(1)}>
            <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>
              1. {t('prepareLive.stepVideo')}
            </Text>
            <View style={[styles.stepBar, step === 1 ? styles.stepBarActive : styles.stepBarDone]} />
          </Pressable>
          <Pressable style={styles.stepItem} onPress={() => setStep(2)}>
            <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>
              2. {t('prepareLive.stepAudio')}
            </Text>
            <View style={[styles.stepBar, step === 2 ? styles.stepBarActive : styles.stepBarInactive]} />
          </Pressable>
        </View>

        {/* ── Step content ──────────────────────────────────────────────── */}
        {step === 1 ? (
          <View>
            <Text style={styles.stepTitle}>{t('prepareLive.video.heading')}</Text>
            <Text style={styles.stepSubtitle}>{t('prepareLive.video.subtitle')}</Text>

            <OptionCard
              icon="phone-portrait-outline"
              title={t('prepareLive.video.smartphone')}
              description={t('prepareLive.video.smartphoneDesc')}
              selected={videoSource === 'smartphone'}
              onPress={() => setVideoSource('smartphone')}
            />

            <OptionCard
              icon="videocam-outline"
              title={t('prepareLive.video.external')}
              description={t('prepareLive.video.externalDesc')}
              selected={videoSource === 'external'}
              onPress={() => setVideoSource('external')}
            />

            {videoSource === 'external' && (
              <Text style={styles.hintText}>
                {t('prepareLive.video.externalHint')}
              </Text>
            )}

            {/* ── RTMP credentials panel (external camera only) ────────── */}
            {videoSource === 'external' && (
              <View style={styles.rtmpSection}>
                <View style={styles.rtmpHeader}>
                  <View style={styles.rtmpHeaderLeft}>
                    <Ionicons name="key-outline" size={16} color={colors.accentLight} />
                    <Text style={styles.rtmpHeaderTitle}>{t('prepareLive.rtmp.title')}</Text>
                  </View>
                  {hasCredentials && (
                    <Pressable onPress={() => setGuideVisible(v => !v)} hitSlop={8}>
                      <Ionicons
                        name={guideVisible ? 'close-circle-outline' : 'help-circle-outline'}
                        size={22}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  )}
                </View>

                {/* Inline camera guide (expandable) */}
                {guideVisible && hasCredentials && (
                  <CameraGuideInline t={t} />
                )}

                {!hasCredentials ? (
                  <View style={styles.rtmpGenerate}>
                    <Text style={styles.rtmpGenerateDesc}>{t('prepareLive.rtmp.generateDesc')}</Text>
                    <Pressable
                      style={[styles.rtmpGenerateBtn, generatingCreds && styles.btnDisabled]}
                      onPress={handleGenerateCredentials}
                      disabled={generatingCreds}
                    >
                      {generatingCreds ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Ionicons name="flash-outline" size={16} color={colors.white} />
                      )}
                      <Text style={styles.rtmpGenerateBtnText}>
                        {generatingCreds ? t('prepareLive.rtmp.generating') : t('prepareLive.rtmp.generate')}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View>
                    {/* Full URL */}
                    <CredentialRow
                      label={t('prepareLive.rtmp.fullUrl')}
                      value={fullUrl!}
                      copied={copiedField === 'full'}
                      onCopy={() => handleCopy('full')}
                      t={t}
                    />
                    {/* Stream key */}
                    <View style={styles.credRow}>
                      <View style={styles.credHeader}>
                        <Text style={styles.credLabel}>{t('prepareLive.rtmp.streamKey')}</Text>
                        <View style={styles.credActions}>
                          <Pressable onPress={() => setShowKey(v => !v)} hitSlop={6}>
                            <Ionicons
                              name={showKey ? 'eye-off-outline' : 'eye-outline'}
                              size={16}
                              color={colors.textSecondary}
                            />
                          </Pressable>
                          <Pressable
                            style={styles.copyBtn}
                            onPress={() => handleCopy('key')}
                          >
                            <Ionicons
                              name={copiedField === 'key' ? 'checkmark' : 'copy-outline'}
                              size={13}
                              color={colors.accentLight}
                            />
                            <Text style={styles.copyBtnText}>
                              {copiedField === 'key' ? t('prepareLive.rtmp.copied') : t('prepareLive.rtmp.copy')}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                      <Text style={styles.credValue} selectable={showKey}>
                        {showKey ? streamKey : maskedKey}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.stepTitle}>{t('prepareLive.audio.heading')}</Text>
            <Text style={styles.stepSubtitle}>{t('prepareLive.audio.subtitle')}</Text>

            <OptionCard
              icon="pulse-outline"
              title={t('prepareLive.audio.interface')}
              description={t('prepareLive.audio.interfaceDesc')}
              selected={audioSource === 'audio-interface'}
              onPress={() => setAudioSource('audio-interface')}
            />

            <OptionCard
              icon="git-merge-outline"
              title={t('prepareLive.audio.usbDirect')}
              description={t('prepareLive.audio.usbDirectDesc')}
              selected={audioSource === 'usb-direct'}
              onPress={() => setAudioSource('usb-direct')}
            />

            {/* Audio/Video test reminder */}
            <View style={styles.testCard}>
              <View style={styles.testCardHeader}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.testCardTitle}>{t('prepareLive.audio.testTitle')}</Text>
              </View>
              <Text style={styles.testCardDesc}>{t('prepareLive.audio.testDesc')}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {step === 1 ? (
          <Pressable style={styles.ctaButton} onPress={() => setStep(2)}>
            <Text style={styles.ctaText}>{t('prepareLive.continueToAudio')}</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.ctaButton, styles.ctaButtonLive, launching && styles.btnDisabled]}
            onPress={handleLaunchLive}
            disabled={launching}
          >
            {launching ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="radio-outline" size={18} color={colors.background} />
            )}
            <Text style={styles.ctaText}>
              {launching ? t('prepareLive.launching') : t('prepareLive.launchLive')}
            </Text>
          </Pressable>
        )}
      </View>

    </View>
  );
}

// ─── Credential row ──────────────────────────────────────────────────────────

function CredentialRow({
  label,
  value,
  copied,
  onCopy,
  t,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.credRow}>
      <View style={styles.credHeader}>
        <Text style={styles.credLabel}>{label}</Text>
        <Pressable style={styles.copyBtn} onPress={onCopy}>
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={13}
            color={colors.accentLight}
          />
          <Text style={styles.copyBtnText}>
            {copied ? t('prepareLive.rtmp.copied') : t('prepareLive.rtmp.copy')}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.credValue} selectable>{value}</Text>
    </View>
  );
}

// ─── Camera guide inline ─────────────────────────────────────────────────────

function CameraGuideInline({ t }: { t: (key: string, opts?: any) => any }) {
  const steps = t('prepareLive.guide.steps', { returnObjects: true }) as string[];

  return (
    <View style={styles.guideInline}>
      <View style={styles.guideInlineHeader}>
        <Ionicons name="videocam-outline" size={16} color={colors.accentLight} />
        <Text style={styles.guideInlineTitle}>{t('prepareLive.guide.title')}</Text>
      </View>
      <Text style={styles.guideInlineSubtitle}>{t('prepareLive.guide.subtitle')}</Text>

      {Array.isArray(steps) && steps.map((stepText, i) => (
        <View key={i} style={styles.guideStep}>
          <View style={styles.guideStepNum}>
            <Text style={styles.guideStepNumText}>{i + 1}</Text>
          </View>
          <Text style={styles.guideStepText}>{stepText}</Text>
        </View>
      ))}

      <View style={styles.guideNote}>
        <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
        <Text style={styles.guideNoteText}>{t('prepareLive.guide.note')}</Text>
      </View>
    </View>
  );
}

// ─── Reusable option card ────────────────────────────────────────────────────

function OptionCard({
  icon,
  title,
  description,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
          <Ionicons
            name={icon}
            size={22}
            color={selected ? colors.accent : colors.textMuted}
          />
        </View>
        <View style={styles.optionTextBlock}>
          <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
            {title}
          </Text>
          <Text style={styles.optionDesc}>{description}</Text>
        </View>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && (
          <Ionicons name="checkmark" size={14} color={colors.accent} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const ACCENT = colors.accent;
const ACCENT_10 = `${ACCENT}1A`;
const ACCENT_20 = `${ACCENT}33`;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },

  // ── Header ────────────────────────────────────────────────────────────
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },

  // ── Step indicator ────────────────────────────────────────────────────
  stepsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  stepItem: {
    flex: 1,
  },
  stepLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  stepLabelActive: {
    color: colors.accent,
  },
  stepBar: {
    height: 3,
    borderRadius: 2,
  },
  stepBarActive: {
    backgroundColor: colors.accent,
  },
  stepBarDone: {
    backgroundColor: colors.textMuted,
  },
  stepBarInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // ── Step content ──────────────────────────────────────────────────────
  stepTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  // ── Option card ───────────────────────────────────────────────────────
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionCardSelected: {
    borderColor: ACCENT,
    backgroundColor: ACCENT_10,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionIconSelected: {
    backgroundColor: ACCENT_20,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: colors.textPrimary,
  },
  optionDesc: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: ACCENT,
    backgroundColor: ACCENT_20,
  },

  // ── Hint text ─────────────────────────────────────────────────────────
  hintText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 18,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  // ── RTMP credentials ──────────────────────────────────────────────────
  rtmpSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  rtmpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rtmpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rtmpHeaderTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
  },
  rtmpGenerate: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rtmpGenerateDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  rtmpGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  rtmpGenerateBtnText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // ── Credential rows ───────────────────────────────────────────────────
  credRow: {
    marginBottom: spacing.sm,
  },
  credHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  credLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credActions: {
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
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  copyBtnText: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
  },
  credValue: {
    color: colors.textPrimary,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
    lineHeight: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    overflow: 'hidden',
  },

  // ── Audio/Video test card ─────────────────────────────────────────────
  testCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  testCardTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
  },
  testCardDesc: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },

  // ── Bottom CTA ────────────────────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: colors.background,
  },
  ctaButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaButtonLive: {
    backgroundColor: colors.accent,
  },
  ctaText: {
    color: colors.background,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 0.5,
  },

  // ── Camera guide inline ──────────────────────────────────────────────
  guideInline: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  guideInlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  guideInlineTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.sm,
  },
  guideInlineSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  guideStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ACCENT_20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  guideStepNumText: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: 11,
  },
  guideStepText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  guideNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.warning}12`,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.warning}25`,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  guideNoteText: {
    flex: 1,
    color: colors.warning,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
});
