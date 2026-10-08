import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors, fonts, fontSize, spacing } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export function RegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'viewer' | 'broadcaster'>('viewer');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert(t('common.error'), t('validation.fillAllFields'));
      return;
    }
    setLoading(true);
    const result = await register(email.trim().toLowerCase(), password, displayName.trim(), role);
    setLoading(false);
    if (!result.success) {
      Alert.alert(t('common.error'), result.error || t('validation.registrationFailed'));
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.title}>{t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.joinShut')}</Text>

          <View style={styles.form}>
            <Input
              label={t('auth.displayName')}
              icon="person-outline"
              placeholder={t('auth.displayNamePlaceholder')}
              value={displayName}
              onChangeText={setDisplayName}
            />
            <Input
              label={t('common.email')}
              icon="mail-outline"
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label={t('common.password')}
              icon="lock-closed-outline"
              placeholder={t('auth.passwordMinPlaceholder')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.roleLabel}>{t('auth.iAm')}</Text>
            <View style={styles.roleRow}>
              <Pressable
                style={[styles.roleOption, role === 'viewer' && styles.roleActive]}
                onPress={() => setRole('viewer')}
              >
                <Text style={[styles.roleText, role === 'viewer' && styles.roleTextActive]}>
                  {t('auth.viewer')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.roleOption, role === 'broadcaster' && styles.roleActive]}
                onPress={() => setRole('broadcaster')}
              >
                <Text style={[styles.roleText, role === 'broadcaster' && styles.roleTextActive]}>
                  {t('auth.broadcasterFestival')}
                </Text>
              </Pressable>
            </View>

            <Button
              title={t('auth.register')}
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.registerButton}
            />
          </View>

          <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
            <Text style={styles.backText}>{t('auth.alreadyHaveAccount')}</Text>
            <Text style={styles.backLink}>{t('auth.login')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: spacing.sm,
    left: 0,
    padding: spacing.sm,
    zIndex: 1,
  },
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    marginBottom: spacing.lg,
  },
  roleLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
  },
  roleActive: {
    borderColor: colors.accentLight,
    backgroundColor: `rgba(123, 116, 200, 0.1)`,
  },
  roleText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  roleTextActive: {
    color: colors.accentLight,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  backLink: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.accentLight,
  },
});
