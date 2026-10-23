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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { login, enterGuestMode, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = t('validation.emailRequired');
    else if (!email.includes('@')) e.email = t('validation.emailInvalid');
    if (!password) e.password = t('validation.passwordRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) {
      Alert.alert(t('common.error'), result.error || t('validation.loginFailed'));
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert(t('common.error'), t('auth.forgotPasswordEnterEmail'));
      return;
    }
    setResetLoading(true);
    const result = await resetPassword(trimmed);
    setResetLoading(false);
    if (result.success) {
      Alert.alert(t('auth.forgotPasswordSentTitle'), t('auth.forgotPasswordSentMessage'));
    } else {
      Alert.alert(t('common.error'), result.error || t('auth.forgotPasswordError'));
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

          <View style={styles.header}>
            <Text style={styles.logo}>SHUT</Text>
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('common.email')}
              icon="mail-outline"
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <Input
              label={t('common.password')}
              icon="lock-closed-outline"
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            <Pressable onPress={handleForgotPassword} style={styles.forgotRow}>
              <Text style={styles.forgotLink}>
                {resetLoading ? t('auth.forgotPasswordSending') : t('auth.forgotPassword')}
              </Text>
            </Pressable>
            <Button
              title={t('auth.login')}
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Pressable onPress={enterGuestMode}>
              <Text style={styles.guestLink}>{t('auth.guestMode')}</Text>
            </Pressable>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>{t('auth.register')}</Text>
              </Pressable>
            </View>

            {/* <View style={styles.demoInfo}>
              <Text style={styles.demoTitle}>{t('auth.demoAccounts')}</Text>
              <Text style={styles.demoText}>Viewer : viewer@shut.app / demo123</Text>
              <Text style={styles.demoText}>Festival : festival@shut.app / demo123</Text>
            </View> */}
          </View>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontFamily: fonts.heading.bold,
    fontSize: 48,
    color: colors.textPrimary,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  form: {
    marginBottom: spacing.xl,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  forgotLink: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  guestLink: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.accentLight,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  registerLink: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.accentLight,
  },
  demoInfo: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  demoTitle: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  demoText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
