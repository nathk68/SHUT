import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParametresStackParamList } from '../navigation/MainTabs';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services';
import { AvatarPicker } from '../components/profile/AvatarPicker';
import { colors, fonts, fontSize, spacing } from '../config/theme';
import type { UpdateProfilePayload, ExperienceLevel } from '../types/profile';
import { MUSIC_GENRES } from '../config/constants';

type Nav = NativeStackNavigationProp<ParametresStackParamList, 'EditProfile'>;

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'confirme', label: 'Confirmé' },
  { value: 'professionnel', label: 'Professionnel' },
];

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useAuth();

  const [bio, setBio] = useState(user?.bio ?? '');
  const [artistName, setArtistName] = useState(user?.artistName ?? '');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [representedCity, setRepresentedCity] = useState(user?.representedCityName ?? '');
  const [experience, setExperience] = useState<ExperienceLevel | undefined>(user?.experience);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    user?.genres ?? []
  );
  const [instagram, setInstagram] = useState(user?.socialLinks?.instagram ?? '');
  const [soundcloud, setSoundcloud] = useState(user?.socialLinks?.soundcloud ?? '');
  const [youtube, setYoutube] = useState(user?.socialLinks?.youtube ?? '');
  const [saving, setSaving] = useState(false);

  const handleAvatarPick = useCallback(async (uri: string) => {
    if (!user) return;
    const url = await userService.uploadAvatar(user.id, uri);
    await updateUser({ avatarUrl: url });
  }, [user, updateUser]);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        bio: bio.trim() || undefined,
        artistName: artistName.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        representedCityName: representedCity.trim() || undefined,
        experience,
        genres: selectedGenres.length > 0 ? selectedGenres : undefined,
        socialLinks: {
          instagram: instagram.trim() || undefined,
          soundcloud: soundcloud.trim() || undefined,
          youtube: youtube.trim() || undefined,
        },
      };
      await updateUser(payload);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [bio, artistName, firstName, lastName, representedCity, experience, selectedGenres, instagram, soundcloud, youtube, updateUser, navigation]);

  if (!user) return null;

  const isDJ = user.role === 'broadcaster';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarRow}>
        <AvatarPicker
          avatarUrl={user.avatarUrl ?? null}
          displayName={user.artistName ?? user.displayName ?? ''}
          editable
          size={88}
          onPick={handleAvatarPick}
        />
      </View>

      {isDJ ? (
        <View style={styles.field}>
          <Text style={styles.label}>Nom d'artiste</Text>
          <TextInput
            testID="input-artistName"
            style={styles.input}
            value={artistName}
            onChangeText={setArtistName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={[styles.field, styles.flex]}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput
            testID="input-firstName"
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={[styles.field, styles.flex]}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            testID="input-lastName"
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          testID="input-bio"
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Ville représentée</Text>
        <TextInput
          testID="input-city"
          style={styles.input}
          value={representedCity}
          onChangeText={setRepresentedCity}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {isDJ ? (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Expérience</Text>
            <View style={styles.optionRow}>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  testID={`exp-${opt.value}`}
                  style={[styles.optionChip, experience === opt.value && styles.optionChipActive]}
                  onPress={() => setExperience(opt.value)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      experience === opt.value && styles.optionLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Genres musicaux</Text>
            <View style={styles.genreGrid}>
              {MUSIC_GENRES.slice(0, 20).map((genre) => (
                <TouchableOpacity
                  key={genre}
                  testID={`genre-${genre}`}
                  style={[
                    styles.optionChip,
                    selectedGenres.includes(genre) && styles.optionChipActive,
                  ]}
                  onPress={() => toggleGenre(genre)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedGenres.includes(genre) && styles.optionLabelActive,
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Instagram</Text>
            <TextInput
              testID="input-instagram"
              style={styles.input}
              value={instagram}
              onChangeText={setInstagram}
              placeholder="@handle"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>SoundCloud</Text>
            <TextInput
              testID="input-soundcloud"
              style={styles.input}
              value={soundcloud}
              onChangeText={setSoundcloud}
              placeholder="username"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>YouTube</Text>
            <TextInput
              testID="input-youtube"
              style={styles.input}
              value={youtube}
              onChangeText={setYoutube}
              placeholder="@channel"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </View>
        </>
      ) : null}

      <TouchableOpacity
        testID="save-button"
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  avatarRow: { alignItems: 'center', marginBottom: spacing.lg },
  field: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(240,239,244,0.2)',
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    backgroundColor: 'rgba(240,239,244,0.05)',
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: {
    borderWidth: 1,
    borderColor: 'rgba(240,239,244,0.2)',
    borderRadius: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  optionChipActive: { borderColor: colors.accent, backgroundColor: 'rgba(151,77,251,0.15)' },
  optionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  optionLabelActive: { color: colors.accent },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 100,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
});
