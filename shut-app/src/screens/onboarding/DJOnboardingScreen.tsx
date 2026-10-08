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
import { useTranslation } from 'react-i18next';
import { db } from '../../config/firebase.config';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LocationSelector, LocationValue } from '../../components/ui/LocationSelector';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { MUSIC_GENRES } from '../../config/constants';
import type { ExperienceLevel } from '../../types/profile';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

const EXPERIENCE_VALUES: ExperienceLevel[] = ['debutant', 'intermediaire', 'confirme', 'professionnel'];
import { useUsernameCheck } from '../../hooks/useUsernameCheck';
import { reserveUsername } from '../../services/username/username.service';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'DJOnboarding'>;
};

const TOTAL_STEPS = 4;

export function DJOnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { register, refreshUser } = useAuth();

  const STEP_TITLES = [
    t('onboarding.dj.stepTitles.0'),
    t('onboarding.dj.stepTitles.1'),
    t('onboarding.dj.stepTitles.2'),
    t('onboarding.dj.stepTitles.3'),
  ];

  const STEP_SUBTITLES = [
    t('onboarding.dj.stepSubtitles.0'),
    t('onboarding.dj.stepSubtitles.1'),
    t('onboarding.dj.stepSubtitles.2'),
    t('onboarding.dj.stepSubtitles.3'),
  ];
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { username, setUsername, status: usernameStatus, error: usernameError } = useUsernameCheck();
  const [artistName, setArtistName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceLevel | undefined>();
  const [worksLinks, setWorksLinks] = useState<string[]>(['']);
  const [location, setLocation] = useState<LocationValue>({});
  const [sameAsResidence, setSameAsResidence] = useState(true);
  const [representedLocation, setRepresentedLocation] = useState<LocationValue>({});
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
        if (!username.trim()) e.username = t('validation.usernameRequired');
        else if (usernameError) e.username = usernameError;
        else if (usernameStatus === 'checking') e.username = t('validation.usernameCheckInProgress');
        else if (usernameStatus !== 'available') e.username = t('validation.usernameUnavailable');
        if (!artistName.trim()) e.artistName = t('onboarding.dj.artistNameRequired');
        if (!bio.trim()) e.bio = t('onboarding.dj.bioRequired');
        break;
      case 1:
        if (selectedGenres.length === 0) e.genres = t('validation.selectAtLeastOneGenre');
        break;
      case 2:
        if (!worksLinks.some(l => l.trim())) e.worksLinks = t('onboarding.dj.addAtLeastOneLink');
        if (!location.cityName) e.location = t('onboarding.dj.selectYourCity');
        if (!sameAsResidence && !representedLocation.cityName) e.representedLocation = t('onboarding.dj.selectRepresentedCity');
        break;
      case 3:
        if (!email.trim()) e.email = t('validation.emailRequired');
        else if (!email.includes('@')) e.email = t('validation.emailInvalid');
        if (!password) e.password = t('validation.passwordRequired');
        else if (password.length < 8) e.password = t('validation.passwordMin8');
        if (password && confirmPassword && password !== confirmPassword) e.confirmPassword = t('validation.passwordMismatch');
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
    const result = await register(email.trim().toLowerCase(), password, artistName.trim(), 'viewer');
    if (!result.success) {
      setLoading(false);
      Alert.alert(t('common.error'), result.error ?? t('validation.registrationFailed'));
      return;
    }
    if (result.userId) {
      try {
        await reserveUsername(username.trim(), result.userId);
        const repLoc = sameAsResidence ? location : representedLocation;
        await Promise.all([
          setDoc(doc(db, 'users', result.userId), {
            username: username.trim(),
            artistName: artistName.trim(),
            bio: bio.trim(),
            genres: selectedGenres,
            experience: experience ?? null,
            cityName: location.cityName ?? '',
            countryCode: location.countryCode ?? '',
            cityId: location.cityId ?? '',
            representedCityName: repLoc.cityName ?? '',
            representedCountryCode: repLoc.countryCode ?? '',
            applicationRole: 'dj',
          }, { merge: true }),
          addDoc(collection(db, 'dj_applications'), {
            userId: result.userId,
            artistName: artistName.trim(),
            bio: bio.trim(),
            genres: selectedGenres,
            experience: experience ?? null,
            worksLinks: worksLinks.filter(l => l.trim()),
            cityName: location.cityName ?? '',
            countryCode: location.countryCode ?? '',
            cityId: location.cityId ?? '',
            status: 'pending',
            submittedAt: new Date().toISOString(),
          }),
        ]);
        await refreshUser();
      } catch (err: any) {
        setLoading(false);
        Alert.alert(t('common.error'), err?.message ?? t('validation.usernameTaken'));
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
              <Ionicons name="disc-outline" size={14} color={colors.accent} />
              <Text style={styles.roleTagText}>{t('onboarding.dj.applicationTag')}</Text>
            </View>
            <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
            <Text style={styles.stepSubtitle}>{STEP_SUBTITLES[step]}</Text>

            {step === 0 && (
              <View>
                <Input
                  label={t('common.username')}
                  placeholder="ex: djkoze_official"
                  icon="at-outline"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.username}
                />
                {usernameStatus === 'available' && !errors.username && (
                  <View style={styles.usernameAvailable}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.usernameAvailableText}>{t('common.usernameAvailable')}</Text>
                  </View>
                )}
                {usernameStatus === 'checking' && !errors.username && (
                  <Text style={styles.usernameChecking}>{t('common.usernameChecking')}</Text>
                )}
                <Input
                  label={t('onboarding.dj.artistName')}
                  placeholder={t('onboarding.dj.artistNamePlaceholder')}
                  icon="mic-outline"
                  value={artistName}
                  onChangeText={setArtistName}
                  autoCorrect={false}
                  error={errors.artistName}
                />
                <Input
                  label={t('onboarding.dj.bioPresentation')}
                  placeholder={t('onboarding.dj.bioPlaceholder')}
                  icon="document-text-outline"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                  error={errors.bio}
                />
              </View>
            )}

            {step === 1 && (
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

                <Text style={[styles.linksLabel, { marginTop: spacing.xl }]}>{t('editProfile.experience')}</Text>
                <View style={styles.genresGrid}>
                  {EXPERIENCE_VALUES.map(val => (
                    <Pressable
                      key={val}
                      style={[styles.genreBadge, experience === val && styles.genreBadgeActive]}
                      onPress={() => setExperience(val)}
                    >
                      <Text style={[styles.genreText, experience === val && styles.genreTextActive]}>
                        {t(`editProfile.experienceOptions.${val}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.linksLabel}>{t('onboarding.dj.linksToSets')}</Text>
                {errors.worksLinks ? <Text style={styles.errorText}>{errors.worksLinks}</Text> : null}
                {worksLinks.map((link, index) => (
                  <View key={index} style={styles.linkRow}>
                    <View style={styles.linkInputWrap}>
                      <Input
                        placeholder={t('onboarding.dj.linksPlaceholder')}
                        icon="link-outline"
                        value={link}
                        onChangeText={v => setWorksLinks(prev => prev.map((l, i) => i === index ? v : l))}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                      />
                    </View>
                    {worksLinks.length > 1 && (
                      <Pressable
                        style={styles.removeLinkBtn}
                        onPress={() => setWorksLinks(prev => prev.filter((_, i) => i !== index))}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                      </Pressable>
                    )}
                  </View>
                ))}
                {worksLinks.length < 3 && (
                  <Pressable
                    style={styles.addLinkBtn}
                    onPress={() => setWorksLinks(prev => [...prev, ''])}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                    <Text style={styles.addLinkText}>{t('onboarding.dj.addLink')}</Text>
                  </Pressable>
                )}
                <View style={styles.locationSeparator} />
                {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
                <LocationSelector value={location} onChange={setLocation} label={t('onboarding.dj.cityWhereYouLive')} />

                <Text style={styles.linksLabel}>{t('onboarding.dj.cityYouRepresent')}</Text>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => setSameAsResidence(prev => !prev)}
                >
                  <View style={[styles.checkbox, sameAsResidence && styles.checkboxActive]}>
                    {sameAsResidence && <Ionicons name="checkmark" size={14} color={colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{t('onboarding.dj.sameAsResidence')}</Text>
                </Pressable>

                {!sameAsResidence && (
                  <>
                    {errors.representedLocation ? <Text style={styles.errorText}>{errors.representedLocation}</Text> : null}
                    <LocationSelector
                      value={representedLocation}
                      onChange={setRepresentedLocation}
                      placeholder={t('onboarding.dj.searchRepresentedCity')}
                      restrictToCountries={['FR', 'CH']}
                    />
                  </>
                )}
              </View>
            )}

            {step === 3 && (
              <View>
                <View style={styles.notice}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                  <Text style={styles.noticeText}>
                    {t('onboarding.dj.djNotice')}
                  </Text>
                </View>
                <Input
                  label={t('common.email')}
                  placeholder={t('auth.emailPlaceholder')}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                />
                <Input
                  label={t('common.password')}
                  placeholder={t('onboarding.dj.passwordPlaceholder')}
                  icon="lock-closed-outline"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                />
                <Input
                  label={t('common.confirmPassword')}
                  placeholder={t('onboarding.dj.confirmPasswordPlaceholder')}
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
            title={step < TOTAL_STEPS - 1 ? t('common.next') : t('onboarding.dj.submitApplication')}
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
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
  linksLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkInputWrap: { flex: 1 },
  removeLinkBtn: {
    paddingTop: spacing.xs,
    paddingLeft: spacing.xs,
  },
  addLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  addLinkText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  locationSeparator: {
    height: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
