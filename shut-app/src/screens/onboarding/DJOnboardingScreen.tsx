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
import { MUSIC_GENRES } from '../../config/constants';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'DJOnboarding'>;
};

const TOTAL_STEPS = 4;

const STEP_TITLES = [
  'Ton identité artistique',
  'Tes styles musicaux',
  'Où trouver ton travail ?',
  'Crée ton compte',
];

const STEP_SUBTITLES = [
  'Présente-toi en quelques mots.',
  'Sélectionne les genres que tu joues.',
  'Un lien vers tes sets, et ta localisation.',
  'Tu commenceras en tant que spectateur en attendant la validation.',
];

export function DJOnboardingScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [username, setUsername] = useState('');
  const [artistName, setArtistName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [worksLinks, setWorksLinks] = useState<string[]>(['']);
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
        else if (username.trim().length < 3) e.username = 'Minimum 3 caractères';
        if (!artistName.trim()) e.artistName = 'Nom d\'artiste requis';
        if (!bio.trim()) e.bio = 'Présentation requise';
        break;
      case 1:
        if (selectedGenres.length === 0) e.genres = 'Sélectionne au moins un style';
        break;
      case 2:
        if (!worksLinks.some(l => l.trim())) e.worksLinks = 'Ajoute au moins un lien';
        if (!location.cityName) e.location = 'Sélectionne ta ville';
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
    const result = await register(email.trim().toLowerCase(), password, artistName.trim(), 'viewer');
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
            artistName: artistName.trim(),
            cityName: location.cityName ?? '',
            countryCode: location.countryCode ?? '',
            cityId: location.cityId ?? '',
            applicationRole: 'dj',
          }, { merge: true }),
          addDoc(collection(db, 'dj_applications'), {
            userId: result.userId,
            artistName: artistName.trim(),
            bio: bio.trim(),
            genres: selectedGenres,
            worksLinks: worksLinks.filter(l => l.trim()),
            cityName: location.cityName ?? '',
            countryCode: location.countryCode ?? '',
            cityId: location.cityId ?? '',
            status: 'pending',
            submittedAt: new Date().toISOString(),
          }),
        ]);
      } catch (err) {
        console.error('DJ application save error:', err);
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
              <Text style={styles.roleTagText}>Candidature DJ</Text>
            </View>
            <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
            <Text style={styles.stepSubtitle}>{STEP_SUBTITLES[step]}</Text>

            {step === 0 && (
              <View>
                <Input
                  label="Pseudo"
                  placeholder="ex: djkoze_official"
                  icon="at-outline"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.username}
                />
                <Input
                  label="Nom d'artiste"
                  placeholder="ex: DJ Koze, Reinier Zonneveld..."
                  icon="mic-outline"
                  value={artistName}
                  onChangeText={setArtistName}
                  autoCorrect={false}
                  error={errors.artistName}
                />
                <Input
                  label="Bio / Présentation"
                  placeholder="Dis-nous qui tu es, ton style, ton parcours..."
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
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.linksLabel}>Liens vers tes sets</Text>
                {errors.worksLinks ? <Text style={styles.errorText}>{errors.worksLinks}</Text> : null}
                {worksLinks.map((link, index) => (
                  <View key={index} style={styles.linkRow}>
                    <View style={styles.linkInputWrap}>
                      <Input
                        placeholder="SoundCloud, Mixcloud, YouTube, RA..."
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
                    <Text style={styles.addLinkText}>Ajouter un lien</Text>
                  </Pressable>
                )}
                <View style={styles.locationSeparator} />
                {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
                <LocationSelector value={location} onChange={setLocation} />
              </View>
            )}

            {step === 3 && (
              <View>
                <View style={styles.notice}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                  <Text style={styles.noticeText}>
                    Tu rejoindras SHUT en tant que spectateur. Ton profil DJ sera activé après validation par notre équipe.
                  </Text>
                </View>
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
