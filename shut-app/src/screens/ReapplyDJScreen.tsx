import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase.config';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MUSIC_GENRES } from '../config/constants';
import type { ExperienceLevel } from '../types/profile';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

const EXPERIENCE_VALUES: ExperienceLevel[] = ['debutant', 'intermediaire', 'confirme', 'professionnel'];

export function ReapplyDJScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [bio, setBio] = useState(user?.bio ?? '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(user?.genres ?? []);
  const [experience, setExperience] = useState<ExperienceLevel | undefined>(user?.experience);
  const [worksLinks, setWorksLinks] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate
    if (!bio.trim()) {
      Alert.alert(t('common.error'), t('onboarding.dj.bioRequired'));
      return;
    }
    if (selectedGenres.length === 0) {
      Alert.alert(t('common.error'), t('validation.selectAtLeastOneGenre'));
      return;
    }
    if (!worksLinks.some(l => l.trim())) {
      Alert.alert(t('common.error'), t('onboarding.dj.addAtLeastOneLink'));
      return;
    }

    Alert.alert(
      t('settings.reapply.confirmTitle'),
      t('settings.reapply.confirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setLoading(true);
            try {
              const callable = httpsCallable(functions, 'reapplyDJ');
              await callable({
                bio: bio.trim(),
                genres: selectedGenres,
                experience: experience ?? null,
                worksLinks: worksLinks.filter(l => l.trim()),
              });
              Alert.alert(t('common.success'), t('settings.reapply.success'), [
                { text: t('common.ok'), onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              const msg = err?.message?.includes('resource-exhausted')
                ? t('settings.reapply.rateLimited')
                : t('settings.reapply.error');
              Alert.alert(t('common.error'), msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }, [bio, selectedGenres, experience, worksLinks, navigation, t]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.reapply.button')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
          <Text style={styles.infoBannerText}>{t('settings.reapply.desc')}</Text>
        </View>

        {/* Bio */}
        <Input
          label={t('onboarding.dj.bioPresentation')}
          placeholder={t('onboarding.dj.bioPlaceholder')}
          icon="document-text-outline"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        {/* Genres */}
        <Text style={styles.sectionLabel}>{t('common.genres')}</Text>
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

        {/* Experience */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>{t('editProfile.experience')}</Text>
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

        {/* Links */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>{t('onboarding.dj.linksToSets')}</Text>
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
      </ScrollView>

      {/* Submit button */}
      <View style={styles.footer}>
        <Button
          title={t('onboarding.dj.submitApplication')}
          onPress={handleSubmit}
          size="lg"
          loading={loading}
          style={styles.submitBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.accent}10`,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.accent}25`,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  submitBtn: { width: '100%' },
});
