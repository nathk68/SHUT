import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { login, resetPassword } = useAuth();
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
    if (!result.success && result.error !== '__BLOCKED__') {
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
            <Image
              source={require('../../../assets/icon-nobg.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.loginButton,
                { opacity: pressed ? 0.8 : loading ? 0.5 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
              )}
            </Pressable>
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
  logoImage: {
    width: 120,
    height: 120,
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
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: colors.white,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    letterSpacing: 0.5,
  },
});
