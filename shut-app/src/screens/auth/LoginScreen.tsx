import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  const { login, enterGuestMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email requis';
    else if (!email.includes('@')) e.email = 'Email invalide';
    if (!password) e.password = 'Mot de passe requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Connexion impossible');
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
          <View style={styles.header}>
            <Text style={styles.logo}>SHUT</Text>
            <Text style={styles.tagline}>Le son live, sans compromis</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              icon="mail-outline"
              placeholder="email@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <Input
              label="Mot de passe"
              icon="lock-closed-outline"
              placeholder="Votre mot de passe"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Pressable onPress={enterGuestMode}>
              <Text style={styles.guestLink}>Mode spectateur</Text>
            </Pressable>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Pas encore de compte ? </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>S'inscrire</Text>
              </Pressable>
            </View>

            <View style={styles.demoInfo}>
              <Text style={styles.demoTitle}>Comptes démo</Text>
              <Text style={styles.demoText}>Viewer : viewer@shut.app / demo123</Text>
              <Text style={styles.demoText}>Festival : festival@shut.app / demo123</Text>
            </View>
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
