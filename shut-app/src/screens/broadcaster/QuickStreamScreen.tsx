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
import { useNavigation } from '@react-navigation/native';
import { copyToClipboard } from '../../utils/clipboard';
import { getStoredData, setStoredData, removeStoredData } from '../../utils/storage';
import { streamingService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

// ─── DJI Mimo guide steps ──────────────────────────────────────────────────────

const MIMO_STEPS = [
  {
    icon: 'phone-portrait-outline' as const,
    title: 'Ouvrir DJI Mimo',
    desc: 'Lance l\'app DJI Mimo et connecte ton Osmo Pocket 3.',
  },
  {
    icon: 'radio-outline' as const,
    title: 'Onglet "Live"',
    desc: 'Dans Mimo, appuie sur l\'icône Live en bas de l\'écran.',
  },
  {
    icon: 'code-slash-outline' as const,
    title: 'RTMP personnalisé',
    desc: 'Choisis "Custom RTMP" ou "RTMP personnalisé" dans la liste.',
  },
  {
    icon: 'copy-outline' as const,
    title: 'Coller l\'URL complète',
    desc: 'Copie l\'URL complète ci-dessus (URL + clé concaténées) et colle-la dans Mimo.',
  },
  {
    icon: 'volume-high-outline' as const,
    title: 'Vérifier l\'audio',
    desc: 'Dans les réglages Mimo, confirme que le son vient bien de l\'entrée micro externe.',
  },
  {
    icon: 'play-circle-outline' as const,
    title: 'Démarrer',
    desc: 'Appuie sur "Démarrer" dans Mimo. Ton live SHUT est en cours !',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickStreamScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [rtmpUrl, setRtmpUrl] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

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
      const creds = await streamingService.startQuickStream(user?.uid ?? 'anonymous');
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
      Alert.alert('Erreur', error?.message ?? 'Impossible de générer les identifiants. Réessaie.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  function handleCopyFull() {
    if (fullUrl) copyToClipboard(fullUrl);
  }

  function handleCopyUrl() {
    if (rtmpUrl) copyToClipboard(rtmpUrl);
  }

  function handleCopyKey() {
    if (streamKey) copyToClipboard(streamKey);
  }

  const hasCredentials = !!rtmpUrl && !!streamKey;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.title}>
        {'CAMÉRA + '}
        <Text style={styles.titleAccent}>STREAM</Text>
      </Text>
      <Text style={styles.subtitle}>
        Configure ton Osmo Pocket 3 avec DJI Mimo pour démarrer le live.
      </Text>

      {/* Generate credentials card */}
      {!hasCredentials ? (
        <View style={styles.generateCard}>
          <View style={styles.generateIcon}>
            <Ionicons name="key-outline" size={32} color={colors.accentLight} />
          </View>
          <Text style={styles.generateTitle}>Génère tes identifiants SHUT</Text>
          <Text style={styles.generateDesc}>
            Un lien RTMP unique est créé pour ton live. Colle-le dans DJI Mimo pour streamer directement vers SHUT.
          </Text>
          <Pressable
            onPress={handleGenerate}
            disabled={loading}
            style={[styles.generateButton, loading && styles.generateButtonLoading]}
          >
            <Ionicons name="flash-outline" size={18} color={colors.white} />
            <Text style={styles.generateButtonText}>
              {loading ? 'Génération en cours...' : 'Générer mes identifiants'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Credentials */}
          <Text style={styles.sectionLabel}>Identifiants de diffusion</Text>

          {/* Full URL (for DJI Mimo) */}
          <View style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <View style={styles.credentialLabelRow}>
                <Ionicons name="videocam-outline" size={14} color={colors.accentLight} />
                <Text style={styles.credentialLabel}>URL complète (DJI Mimo)</Text>
              </View>
              <Pressable onPress={handleCopyFull} style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={14} color={colors.accentLight} />
                <Text style={styles.copyBtnText}>Copier</Text>
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
                <Text style={styles.credentialLabel}>URL RTMP (OBS / encodeur)</Text>
              </View>
              <Pressable onPress={handleCopyUrl} style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={14} color={colors.accentLight} />
                <Text style={styles.copyBtnText}>Copier</Text>
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
                <Text style={styles.credentialLabel}>Clé de stream</Text>
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
                  <Ionicons name="copy-outline" size={14} color={colors.accentLight} />
                  <Text style={styles.copyBtnText}>Copier</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.credentialValue} selectable={showKey}>
              {showKey ? streamKey : maskedKey}
            </Text>
          </View>
        </>
      )}

      {/* DJI Mimo guide */}
      <View style={styles.guideCard}>
        <View style={styles.guideHeader}>
          <Ionicons name="videocam-outline" size={18} color={colors.accentLight} />
          <Text style={styles.guideTitle}>Configuration DJI Mimo</Text>
        </View>
        <Text style={styles.guideSubtitle}>
          Suis ces étapes une fois tes identifiants générés.
        </Text>

        {MIMO_STEPS.map((step, i) => (
          <View key={i} style={styles.guideStep}>
            <View style={styles.guideStepLeft}>
              <View style={styles.guideStepNumber}>
                <Text style={styles.guideStepNumberText}>{i + 1}</Text>
              </View>
              {i < MIMO_STEPS.length - 1 && <View style={styles.guideStepLine} />}
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
          Rappel audio : la sortie de ta table de mix doit être branchée sur l'entrée mic de l'Osmo AVANT de démarrer Mimo.
        </Text>
      </View>

      {/* CTA */}
      {hasCredentials && (
        <Pressable
          onPress={() => navigation.navigate('LiveControl', { eventId })}
          style={styles.goLiveButton}
        >
          <Ionicons name="radio-outline" size={20} color={colors.white} />
          <Text style={styles.goLiveButtonText}>Voir le dashboard live →</Text>
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
          <Text style={styles.regenerateText}>Réinitialiser (générer de nouveaux identifiants)</Text>
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
});
