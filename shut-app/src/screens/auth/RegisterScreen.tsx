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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'viewer' | 'broadcaster'>('viewer');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    const result = await register(email.trim().toLowerCase(), password, displayName.trim(), role);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Inscription impossible');
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
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez l'expérience SHUT</Text>

          <View style={styles.form}>
            <Input
              label="Nom d'affichage"
              icon="person-outline"
              placeholder="Votre nom"
              value={displayName}
              onChangeText={setDisplayName}
            />
            <Input
              label="Email"
              icon="mail-outline"
              placeholder="email@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Mot de passe"
              icon="lock-closed-outline"
              placeholder="Minimum 6 caractères"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.roleLabel}>Je suis :</Text>
            <View style={styles.roleRow}>
              <Pressable
                style={[styles.roleOption, role === 'viewer' && styles.roleActive]}
                onPress={() => setRole('viewer')}
              >
                <Text style={[styles.roleText, role === 'viewer' && styles.roleTextActive]}>
                  Spectateur
                </Text>
              </Pressable>
              <Pressable
                style={[styles.roleOption, role === 'broadcaster' && styles.roleActive]}
                onPress={() => setRole('broadcaster')}
              >
                <Text style={[styles.roleText, role === 'broadcaster' && styles.roleTextActive]}>
                  Diffuseur / Festival
                </Text>
              </Pressable>
            </View>

            <Button
              title="S'inscrire"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.registerButton}
            />
          </View>

          <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
            <Text style={styles.backText}>Déjà un compte ? </Text>
            <Text style={styles.backLink}>Se connecter</Text>
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
