import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../../config/firebase.config';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LocationSelector, LocationValue } from '../../components/ui/LocationSelector';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { MUSIC_GENRES } from '../../config/constants';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { useUsernameCheck } from '../../hooks/useUsernameCheck';
import { reserveUsername } from '../../services/username/username.service';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SpectatorOnboarding'>;
};

const TOTAL_STEPS = 6;

const STEP_TITLES = [
  'Choisis ton pseudo',
  'Comment tu t\'appelles ?',
  'Ta date de naissance',
  'Tes styles préférés',
  'Où tu es ? (optionnel)',
  'Crée ton compte',
];

const STEP_SUBTITLES = [
  'Ce sera ton identifiant visible sur SHUT.',
  'Pour qu\'on sache comment t\'appeler.',
  'Pour personnaliser ton expérience.',
  'On te recommandera des lives qui te correspondent.',
  'Pour découvrir les lives près de chez toi. Tu peux passer cette étape.',
  'Pour accéder à l\'application.',
];

export function SpectatorOnboardingScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { username, setUsername, status: usernameStatus, error: usernameError } = useUsernameCheck();
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
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

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre],
    );
  }, []);

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!username.trim()) e.username = 'Pseudo requis';
        else if (usernameError) e.username = usernameError;
        else if (usernameStatus === 'checking') e.username = 'Vérification en cours...';
        else if (usernameStatus !== 'available') e.username = 'Pseudo non disponible';
        break;
      case 1:
        if (!firstName.trim()) e.firstName = 'Prénom requis';
        break;
      case 2:
        if (!birthDate) e.birthDate = 'Date de naissance requise';
        break;
      case 3:
        if (selectedGenres.length === 0) e.genres = 'Sélectionne au moins un style';
        break;
      // step 4 (localisation) est optionnel — pas de validation

      case 5:
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
    const result = await register(email.trim().toLowerCase(), password, username.trim(), 'viewer');
    if (!result.success) {
      setLoading(false);
      Alert.alert('Erreur', result.error ?? 'Inscription impossible');
      return;
    }
    if (result.userId) {
      try {
        await reserveUsername(username.trim(), result.userId);
        const birthDateStr = birthDate
          ? `${String(birthDate.getDate()).padStart(2, '0')}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${birthDate.getFullYear()}`
          : '';
        await setDoc(doc(db, 'users', result.userId), {
          username: username.trim(),
          firstName: firstName.trim(),
          birthDate: birthDateStr,
          genres: selectedGenres,
          cityName: location.cityName ?? '',
          countryCode: location.countryCode ?? '',
          cityId: location.cityId ?? '',
        }, { merge: true });
      } catch (err: any) {
        setLoading(false);
        Alert.alert('Erreur', err?.message ?? 'Ce pseudo est déjà pris');
        return;
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
        {/* Barre de progression */}
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
            <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
            <Text style={styles.stepSubtitle}>{STEP_SUBTITLES[step]}</Text>

            {step === 0 && (
              <View>
                <Input
                  label="Pseudo"
                  placeholder="ex: beathead99"
                  icon="at-outline"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.username}
                />
                {usernameStatus === 'available' && !errors.username && (
                  <View style={styles.usernameAvailable}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success ?? '#4CAF50'} />
                    <Text style={styles.usernameAvailableText}>Pseudo disponible</Text>
                  </View>
                )}
                {usernameStatus === 'checking' && !errors.username && (
                  <Text style={styles.usernameChecking}>Vérification...</Text>
                )}
              </View>
            )}

            {step === 1 && (
              <Input
                label="Prénom"
                placeholder="ex: Lucas"
                icon="person-outline"
                value={firstName}
                onChangeText={setFirstName}
                error={errors.firstName}
              />
            )}

            {step === 2 && (
              <View>
                <Text style={styles.dateLabel}>Date de naissance</Text>
                <Pressable style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={styles.dateIcon} />
                  <Text style={[styles.dateValue, !birthDate && styles.datePlaceholder]}>
                    {birthDate
                      ? `${String(birthDate.getDate()).padStart(2, '0')}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${birthDate.getFullYear()}`
                      : 'Sélectionner ta date de naissance'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
                {errors.birthDate ? <Text style={styles.errorText}>{errors.birthDate}</Text> : null}

                {/* iOS : modal avec spinner */}
                {Platform.OS === 'ios' && (
                  <Modal visible={showDatePicker} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <Text style={styles.modalTitle}>Date de naissance</Text>
                          <Pressable onPress={() => setShowDatePicker(false)} style={styles.modalDone}>
                            <Text style={styles.modalDoneText}>Confirmer</Text>
                          </Pressable>
                        </View>
                        <DateTimePicker
                          value={birthDate ?? new Date(2000, 0, 1)}
                          mode="date"
                          display="spinner"
                          maximumDate={new Date()}
                          minimumDate={new Date(1920, 0, 1)}
                          onChange={(_, selected) => { if (selected) setBirthDate(selected); }}
                          locale="fr-FR"
                          themeVariant="dark"
                          textColor={colors.textPrimary}
                          style={styles.iosPicker}
                        />
                      </View>
                    </View>
                  </Modal>
                )}

                {/* Android : dialogue natif */}
                {Platform.OS === 'android' && showDatePicker && (
                  <DateTimePicker
                    value={birthDate ?? new Date(2000, 0, 1)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    minimumDate={new Date(1920, 0, 1)}
                    onChange={(_, selected) => {
                      setShowDatePicker(false);
                      if (selected) setBirthDate(selected);
                    }}
                  />
                )}
              </View>
            )}

            {step === 3 && (
              <View>
                {errors.genres ? <Text style={styles.errorText}>{errors.genres}</Text> : null}
                <View style={styles.genresGrid}>
                  {MUSIC_GENRES.map(genre => (
                    <Pressable
                      key={genre}
                      style={[styles.genreBadge, selectedGenres.includes(genre) && styles.genreBadgeActive]}
                      onPress={() => toggleGenre(genre)}
                    >
                      <Text style={[styles.genreText, selectedGenres.includes(genre) && styles.genreTextActive]}>
                        {genre}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 4 && (
              <View>
                {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
                <LocationSelector value={location} onChange={setLocation} />
              </View>
            )}

            {step === 5 && (
              <View>
                <Input
                  label="Email"
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
            title={step < TOTAL_STEPS - 1 ? 'Suivant' : 'Créer mon compte'}
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
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
  },
  genreBadgeActive: {
    backgroundColor: `${colors.accent}20`,
    borderColor: colors.accent,
  },
  genreText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  genreTextActive: { color: colors.accent },
  dateLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dateIcon: { marginRight: 2 },
  dateValue: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  datePlaceholder: { color: colors.textMuted },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  modalDone: { padding: spacing.xs },
  modalDoneText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.accent,
  },
  iosPicker: {
    backgroundColor: colors.backgroundElevated,
  },
  usernameAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  usernameAvailableText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.success,
  },
  usernameChecking: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    paddingTop: spacing.sm,
  },
  nextButton: { alignSelf: 'stretch' },
});
