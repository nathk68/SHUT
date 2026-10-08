import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { ReportReason, ReportTargetType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { submitReport } from '../../services/report/report.firebase';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}

const REASONS: ReportReason[] = ['inappropriate', 'spam', 'harassment', 'copyright', 'other'];

export function ReportModal({ visible, onClose, targetType, targetId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason || !user?.id) return;
    setLoading(true);
    try {
      await submitReport(user.id, targetType, targetId, selectedReason, description.trim() || undefined);
      Alert.alert(t('report.successTitle'), t('report.successMessage'));
      onClose();
      setSelectedReason(null);
      setDescription('');
    } catch {
      Alert.alert(t('common.error'), t('report.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('report.title')}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>{t('report.selectReason')}</Text>

            {REASONS.map((reason) => (
              <Pressable
                key={reason}
                style={[styles.reasonItem, selectedReason === reason && styles.reasonItemActive]}
                onPress={() => setSelectedReason(reason)}
              >
                <View style={[styles.radio, selectedReason === reason && styles.radioActive]}>
                  {selectedReason === reason && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                  {t(`report.reasons.${reason}`)}
                </Text>
              </Pressable>
            ))}

            <Text style={styles.descLabel}>{t('report.descriptionLabel')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('report.descriptionPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <Pressable
              style={[styles.submitBtn, (!selectedReason || loading) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!selectedReason || loading}
            >
              <Text style={styles.submitText}>
                {loading ? t('common.loading') : t('report.submit')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  closeBtn: { padding: spacing.xs },
  subtitle: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  reasonItemActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}10`,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.accent },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  reasonText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  reasonTextActive: { color: colors.textPrimary },
  descLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.white,
  },
});
