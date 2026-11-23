import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { donationService } from '../../services';

interface DonationModalProps {
  visible: boolean;
  onClose: () => void;
  onDonated?: () => void;
  onSuppressSession?: () => void;
  context?: 'live' | 'replay' | 'postlive' | 'settings';
}

const PRESET_AMOUNTS = [2, 5, 10];

export function DonationModal({ visible, onClose, onDonated, onSuppressSession, context }: DonationModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const effectiveAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);
  const isValid = effectiveAmount >= 0.5;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (text: string) => {
    // Allow only digits and one decimal separator
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    setCustomAmount(cleaned);
    setSelectedAmount(null);
  };

  const handleDonate = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const amountCents = Math.round(effectiveAmount * 100);
      const { url } = await donationService.createCheckout(amountCents);
      await Linking.openURL(url);
      onDonated?.();
      resetAndClose();
    } catch {
      Alert.alert(t('common.error'), t('donation.error'));
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    if (dontShowAgain && onSuppressSession) {
      onSuppressSession();
    } else {
      onClose();
    }
    setSelectedAmount(null);
    setCustomAmount('');
    setDontShowAgain(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg, maxHeight: '85%' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="heart" size={22} color={colors.accent} />
              <Text style={styles.title}>{t('donation.title')}</Text>
            </View>
            <Pressable onPress={resetAndClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{t('donation.subtitle')}</Text>

          {/* Preset amounts */}
          <View style={styles.presetsRow}>
            {PRESET_AMOUNTS.map((amount) => {
              const active = selectedAmount === amount;
              return (
                <Pressable
                  key={amount}
                  onPress={() => handleSelectPreset(amount)}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                >
                  <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                    {amount}{t('donation.currency')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom amount input */}
          <TextInput
            style={styles.customInput}
            value={customAmount}
            onChangeText={handleCustomChange}
            placeholder={t('donation.customPlaceholder')}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />

          {/* Don't show again checkbox */}
          {onSuppressSession && (
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setDontShowAgain((v) => !v)}
            >
              <View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                {t('donation.dontShowAgain')}
              </Text>
            </Pressable>
          )}

          {/* Donate button */}
          <Pressable
            style={[styles.donateBtn, (!isValid || loading) && styles.donateBtnDisabled]}
            onPress={handleDonate}
            disabled={!isValid || loading}
          >
            <Ionicons name="heart-outline" size={20} color={colors.white} />
            <Text style={styles.donateBtnText}>
              {loading ? t('common.loading') : t('donation.donate')}
            </Text>
          </Pressable>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: `${colors.accent}20`,
    borderColor: colors.accent,
  },
  presetChipText: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: colors.accentLight,
  },
  customInput: {
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.xs,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
  },
  donateBtnDisabled: {
    opacity: 0.4,
  },
  donateBtnText: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    color: colors.white,
    letterSpacing: 0.5,
  },
});
