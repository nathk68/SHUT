import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<{ ApplicationResult: { decision: 'approved' | 'rejected' } }, 'ApplicationResult'>;

export function ApplicationResultScreen({ route }: Props) {
  const { decision } = route.params;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const isApproved = decision === 'approved';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: isApproved ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
          <Ionicons
            name={isApproved ? 'checkmark-circle' : 'close-circle'}
            size={64}
            color={isApproved ? '#22c55e' : colors.error}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {t(`notifications.applicationDetail.${isApproved ? 'approvedTitle' : 'rejectedTitle'}`)}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          {t(`notifications.applicationDetail.${isApproved ? 'approvedMessage' : 'rejectedMessage'}`)}
        </Text>

        {/* Contact button (rejected only) */}
        {!isApproved && (
          <Pressable
            style={styles.contactBtn}
            onPress={() => Linking.openURL('mailto:contact@shutdiffusion.com')}
          >
            <Ionicons name="mail-outline" size={18} color={colors.accent} />
            <Text style={styles.contactBtnText}>
              {t('notifications.applicationDetail.contactUs')}
            </Text>
          </Pressable>
        )}

        {/* Back button */}
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 80,
    gap: spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: spacing.sm,
  },
  contactBtnText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.accent,
  },
  backBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  backBtnText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
