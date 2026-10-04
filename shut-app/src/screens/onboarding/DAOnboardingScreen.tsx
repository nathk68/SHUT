import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../../config/firebase.config';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LocationSelector, LocationValue } from '../../components/ui/LocationSelector';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'DAOnboarding'>;
};

const TOTAL_STEPS = 4;

const VENUE_TYPES = ['Club', 'Festival', 'Les deux'] as const;
type VenueType = typeof VENUE_TYPES[number];

const CAPACITY_OPTIONS = ['< 500', '500 – 2 000', '2 000+'] as const;
type CapacityOption = typeof CAPACITY_OPTIONS[number];

const STEP_TITLES = [
  'Qui es-tu ?',
  'Ton lieu',
  'Où trouver ton lieu ?',
  'Crée ton compte',
];

const STEP_SUBTITLES = [
  'Présente-toi ainsi que ton établissement.',
  'Quelques infos sur ta structure.',
  'Un lien pour retrouver ton lieu, et sa localisation.',
  'Tu commenceras en tant que spectateur en attendant la validation.',
];

export function DAOnboardingScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueType, setVenueType] = useState<VenueType | null>(null);
  const [capacity, setCapacity] = useState<CapacityOption | null>(null);
  const [venueLink, setVenueLink] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationValue>({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goToStep = useCallback((next: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(next);
      setErrors({});
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!username.trim()) e.username = 'Pseudo requis';
        else if (username.trim().length < 3) e.username = 'Minimum 3 caractères';
        if (!firstName.trim()) e.firstName = 'Prénom requis';
        if (!lastName.trim()) e.lastName = 'Nom requis';
        if (!venueName.trim()) e.venueName = 'Nom du lieu requis';
        break;
      case 1:
        if (!venueType) e.venueType = 'Sélectionne un type';
        if (!capacity) e.capacity = 'Sélectionne une jauge';
        break;
      case 2:
        if (!venueLink.trim()) e.venueLink = 'Lien requis';
        if (!description.trim()) e.description = 'Description requise';
        if (!location.cityName) e.location = 'Sélectionne la ville du lieu';
        break;
      case 3:
        if (!email.trim()) e.email = 'Email requis';
        else if (!email.includes('@')) e.email = 'Email invalide';
        if (!password) e.password = 'Mot de passe requis';
        else if (password.length < 8) e.password = 'Minimum 8 caractères';
        if (password && confirmPassword && password !== confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
        break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) {
      goToStep(step + 1);
      return;
    }
    setLoading(true);
    const displayName = `${firstName.trim()} ${lastName.trim()}`;
    const result = await register(email.trim().toLowerCase(), password, displayName, 'viewer');
    if (!result.success) {
      setLoading(false);
      Alert.alert('Erreur', result.error ?? 'Inscription impossible');
      return;
    }
    if (result.userId) {
      try {
        await Promise.all([
          setDoc(doc(db, 'users', result.userId), {
            username: username.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            cityName: location.cityName ?? '',
            countryCode: location.countryCode ?? '',
            cityId: location.cityId ?? '',
            applicationRole: 'artistic_director',
          }, { merge: true }),
          addDoc(collection(db, 'da_applications'), {
            userId: result.userId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            venueName: venueName.trim(),
            venueType,
            capacity,
            venueLink: venueLink.trim(),
            description: description.trim(),
            cityName: location.cityName ?? '',
            countryCode: location.countryCode ?? '',
            cityId: location.cityId ?? '',
            status: 'pending',
            submittedAt: new Date().toISOString(),
          }),
        ]);
      } catch (err) {
        console.error('DA application save error:', err);
      }
    }
    setLoading(false);
    // isAuthenticated → RootNavigator bascule automatiquement sur MainTabs
  };

  const handleBack = () => {
    if (step > 0) goToStep(step - 1);
    else navigation.goBack();
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` as unknown as number }]} />
          </View>
          <Text style={styles.stepCount}>{step + 1}/{TOTAL_STEPS}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.roleTag}>
              <Ionicons name="business-outline" size={14} color={colors.accent} />
              <Text style={styles.roleTagText}>Candidature Directeur Artistique</Text>
            </View>
            <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
            <Text style={styles.stepSubtitle}>{STEP_SUBTITLES[step]}</Text>

            {step === 0 && (
              <View>
                <Input
                  label="Pseudo"
                  placeholder="ex: rexclub_paris"
                  icon="at-outline"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.username}
                />
                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <Input
                      label="Prénom"
                      placeholder="ex: Marie"
                      icon="person-outline"
                      value={firstName}
                      onChangeText={setFirstName}
                      error={errors.firstName}
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <Input
                      label="Nom"
                      placeholder="ex: Dupont"
                      value={lastName}
                      onChangeText={setLastName}
                      error={errors.lastName}
                    />
                  </View>
                </View>
                <Input
                  label="Nom du club / festival"
                  placeholder="ex: Rex Club, Sonar, Dour..."
                  icon="musical-notes-outline"
                  value={venueName}
                  onChangeText={setVenueName}
                  error={errors.venueName}
                />
              </View>
            )}

            {step === 1 && (
              <View>
                <Text style={styles.selectorLabel}>Type de structure</Text>
                {errors.venueType ? <Text style={styles.errorText}>{errors.venueType}</Text> : null}
                <View style={styles.optionsRow}>
                  {VENUE_TYPES.map(type => (
                    <Pressable
                      key={type}
                      style={[styles.optionButton, venueType === type && styles.optionButtonActive]}
                      onPress={() => setVenueType(type)}
                    >
                      <Text style={[styles.optionText, venueType === type && styles.optionTextActive]}>
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.selectorLabel, { marginTop: spacing.lg }]}>Jauge</Text>
                {errors.capacity ? <Text style={styles.errorText}>{errors.capacity}</Text> : null}
                <View style={styles.optionsRow}>
                  {CAPACITY_OPTIONS.map(cap => (
                    <Pressable
                      key={cap}
                      style={[styles.optionButton, capacity === cap && styles.optionButtonActive]}
                      onPress={() => setCapacity(cap)}
                    >
                      <Text style={[styles.optionText, capacity === cap && styles.optionTextActive]}>
                        {cap}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Input
                  label="Lien vers ton lieu"
                  placeholder="Site web, Instagram, RA, Facebook..."
                  icon="link-outline"
                  value={venueLink}
                  onChangeText={setVenueLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  error={errors.venueLink}
                />
                <Input
                  label="Description & besoins"
                  placeholder="Parle-nous de ton lieu et de ce que tu recherches..."
                  icon="document-text-outline"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                  error={errors.description}
                />
                {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
                <LocationSelector value={location} onChange={setLocation} />
              </View>
            )}

            {step === 3 && (
              <View>
                <View style={styles.notice}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                  <Text style={styles.noticeText}>
                    Tu rejoindras SHUT en tant que spectateur. Ton accès Directeur Artistique sera activé après validation par notre équipe.
                  </Text>
                </View>
                <Input
                  label="Email professionnel"
                  placeholder="email@exemple.com"
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                />
                <Input
                  label="Mot de passe"
                  placeholder="Minimum 8 caractères"
                  icon="lock-closed-outline"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                />
                <Input
                  label="Confirmer le mot de passe"
                  placeholder="Répète ton mot de passe"
                  icon="lock-closed-outline"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={errors.confirmPassword}
                />
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={step < TOTAL_STEPS - 1 ? 'Suivant' : 'Envoyer ma candidature'}
            onPress={handleNext}
            size="lg"
            loading={loading}
            style={styles.nextButton}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: { padding: spacing.xs },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  stepCount: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    minWidth: 28,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  roleTagText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: { flex: 1 },
  selectorLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
  },
  optionButtonActive: {
    backgroundColor: `${colors.accent}20`,
    borderColor: colors.accent,
  },
  optionText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  optionTextActive: { color: colors.accent },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: `${colors.accent}10`,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.accent}25`,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    paddingTop: spacing.sm,
  },
  nextButton: { alignSelf: 'stretch' },
});
