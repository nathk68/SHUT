import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase.config';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import type { DJApplication } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminApplicationDetail'>;

export function AdminApplicationDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { applicationId, type } = route.params;
  const [app, setApp] = useState<DJApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const col = type === 'dj' ? 'dj_applications' : 'da_applications';
    getDoc(doc(db, col, applicationId)).then((snap) => {
      if (snap.exists()) setApp({ id: snap.id, ...snap.data() } as DJApplication);
      setLoading(false);
    });
  }, [applicationId, type]);

  const handleDecision = (decision: 'approved' | 'rejected') => {
    const titleKey = decision === 'approved' ? 'admin.applications.confirmApprove' : 'admin.applications.confirmReject';
    Alert.alert(t(titleKey), t('admin.applications.confirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: decision === 'approved' ? 'default' : 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            const fn = httpsCallable(functions, 'reviewApplication');
            await fn({ applicationId, type, decision });
            setApp((prev) => prev ? { ...prev, status: decision } : prev);
            Alert.alert(t('common.success'), t(`admin.applications.${decision}Success`));
          } catch (e) {
            Alert.alert(t('common.error'), t('admin.applications.actionError'));
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!app) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t('admin.applications.notFound')}</Text>
      </View>
    );
  }

  const isPending = app.status === 'pending';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('admin.applications.detail')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Artist name */}
        <Text style={styles.artistName}>{app.artistName}</Text>
        <Text style={styles.dateText}>{t('admin.applications.submittedOn', { date: new Date(app.submittedAt).toLocaleDateString() })}</Text>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.applications.bio')}</Text>
          <Text style={styles.bodyText}>{app.bio}</Text>
        </View>

        {/* Genres */}
        {app.genres?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.applications.genres')}</Text>
            <View style={styles.genreRow}>
              {app.genres.map((g) => (
                <View key={g} style={styles.genreChip}>
                  <Text style={styles.genreChipText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Experience */}
        {app.experience && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('editProfile.experience')}</Text>
            <View style={styles.genreRow}>
              <View style={styles.genreChip}>
                <Text style={styles.genreChipText}>{t(`editProfile.experienceOptions.${app.experience}`)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.applications.location')}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{app.cityName}{app.countryCode ? `, ${app.countryCode}` : ''}</Text>
          </View>
        </View>

        {/* Links */}
        {app.worksLinks?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.applications.links')}</Text>
            {app.worksLinks.map((link, i) => (
              <Pressable key={i} style={styles.linkRow} onPress={() => Linking.openURL(link)}>
                <Ionicons name="link-outline" size={16} color={colors.accent} />
                <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
                <Ionicons name="open-outline" size={14} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Action buttons */}
        {isPending && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleDecision('rejected')}
              disabled={actionLoading}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.white} />
              <Text style={styles.actionBtnText}>{t('admin.applications.reject')}</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleDecision('approved')}
              disabled={actionLoading}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
              <Text style={styles.actionBtnText}>{t('admin.applications.approve')}</Text>
            </Pressable>
          </View>
        )}

        {!isPending && (
          <View style={styles.decidedBanner}>
            <Ionicons
              name={app.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={app.status === 'approved' ? '#22c55e' : colors.error}
            />
            <Text style={[styles.decidedText, { color: app.status === 'approved' ? '#22c55e' : colors.error }]}>
              {t(`admin.applications.status.${app.status}`)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { color: colors.textSecondary, fontFamily: fonts.body.regular, fontSize: fontSize.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  artistName: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  dateText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.accent}15`,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
  },
  genreChipText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: borderRadius.full,
  },
  approveBtn: { backgroundColor: '#22c55e' },
  rejectBtn: { backgroundColor: colors.error },
  actionBtnText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  decidedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  decidedText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
