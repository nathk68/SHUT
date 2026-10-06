import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParametresStackParamList } from '../navigation/MainTabs';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services';
import i18n from '../i18n';
import { AvatarPicker } from '../components/profile/AvatarPicker';
import { LocationSelector, LocationValue } from '../components/ui/LocationSelector';
import { colors, fonts, fontSize, spacing } from '../config/theme';
import type { UpdateProfilePayload, ExperienceLevel } from '../types/profile';
import { MUSIC_GENRES } from '../config/constants';
import { useUsernameCheck } from '../hooks/useUsernameCheck';
import { changeUsername } from '../services/username/username.service';

type Nav = NativeStackNavigationProp<ParametresStackParamList, 'EditProfile'>;

const EXPERIENCE_VALUES: ExperienceLevel[] = ['debutant', 'intermediaire', 'confirme', 'professionnel'];

export function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useAuth();

  const experienceOptions = EXPERIENCE_VALUES.map((v) => ({
    value: v,
    label: t(`editProfile.experienceOptions.${v}`),
  }));

  const { username: editedUsername, setUsername: setEditedUsername, status: usernameStatus, error: usernameError } = useUsernameCheck(user?.username);

  const parsedBirth = (() => {
    if (!user?.birthDate) return null;
    const parts = user.birthDate.split('/');
    if (parts.length === 3) {
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  })();
  const [birthDate, setBirthDate] = useState<Date | null>(parsedBirth);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [artistName, setArtistName] = useState(user?.artistName ?? '');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [residenceLocation, setResidenceLocation] = useState<LocationValue>({
    cityName: user?.cityName,
    countryCode: user?.countryCode,
  });
  const [location, setLocation] = useState<LocationValue>({
    cityName: user?.representedCityName,
    countryCode: user?.representedCountryCode,
  });
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
    if (editedUsername && usernameStatus !== 'available' && editedUsername !== user?.username) {
      Alert.alert(t('common.error'), usernameError ?? t('validation.usernameNotAvailable'));
      return;
    }
    setSaving(true);
    try {
      // Handle username change atomically
      const usernameChanged = editedUsername && editedUsername !== (user?.username ?? '');
      if (usernameChanged && user) {
        await changeUsername(user.username ?? '', editedUsername, user.id);
      }
      const birthDateStr = birthDate
        ? `${String(birthDate.getDate()).padStart(2, '0')}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${birthDate.getFullYear()}`
        : undefined;
      const payload: UpdateProfilePayload = {
        ...(usernameChanged ? { username: editedUsername } : {}),
        birthDate: birthDateStr,
        bio: bio.trim() || undefined,
        artistName: artistName.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        cityName: residenceLocation.cityName || undefined,
        countryCode: residenceLocation.countryCode || undefined,
        representedCityName: location.cityName || undefined,
        representedCountryCode: location.countryCode || undefined,
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
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message ?? t('validation.cannotSave'));
    } finally {
      setSaving(false);
    }
  }, [editedUsername, usernameStatus, usernameError, user, birthDate, bio, artistName, firstName, lastName, residenceLocation, location, experience, selectedGenres, instagram, soundcloud, youtube, updateUser, navigation]);

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

      <View style={styles.field}>
        <Text style={styles.label}>{t('editProfile.username')}</Text>
        <View style={styles.usernameInputRow}>
          <Text style={styles.atPrefix}>@</Text>
          <TextInput
            style={[styles.input, styles.usernameInput]}
            value={editedUsername}
            onChangeText={setEditedUsername}
            placeholderTextColor={colors.textSecondary}
            placeholder={t('editProfile.usernamePlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {usernameStatus === 'available' && editedUsername !== (user?.username ?? '') && (
          <View style={styles.usernameStatusRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.usernameAvailableText}>{t('common.usernameAvailable')}</Text>
          </View>
        )}
        {usernameStatus === 'checking' && (
          <Text style={styles.usernameCheckingText}>{t('common.usernameChecking')}</Text>
        )}
        {usernameError && (
          <Text style={styles.usernameErrorText}>{usernameError}</Text>
        )}
      </View>

      {isDJ ? (
        <View style={styles.field}>
          <Text style={styles.label}>{t('editProfile.artistName')}</Text>
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
          <Text style={styles.label}>{t('editProfile.firstName')}</Text>
          <TextInput
            testID="input-firstName"
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={[styles.field, styles.flex]}>
          <Text style={styles.label}>{t('editProfile.lastName')}</Text>
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
        <Text style={styles.label}>{t('editProfile.bio')}</Text>
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
        <Text style={styles.label}>{t('editProfile.birthDate')}</Text>
        <Pressable style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.dateValue, !birthDate && styles.datePlaceholder]}>
            {birthDate
              ? `${String(birthDate.getDate()).padStart(2, '0')}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${birthDate.getFullYear()}`
              : t('editProfile.selectDate')}
          </Text>
        </Pressable>

        {Platform.OS === 'ios' && (
          <Modal visible={showDatePicker} transparent animationType="slide">
            <View style={styles.dateModalOverlay}>
              <View style={styles.dateModalContent}>
                <View style={styles.dateModalHeader}>
                  <Text style={styles.dateModalTitle}>{t('editProfile.birthDate')}</Text>
                  <Pressable onPress={() => setShowDatePicker(false)} style={styles.dateModalDone}>
                    <Text style={styles.dateModalDoneText}>{t('common.confirm')}</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={birthDate ?? new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1920, 0, 1)}
                  onChange={(_, selected) => { if (selected) setBirthDate(selected); }}
                  locale={i18n.language === 'fr' ? 'fr-FR' : 'en-US'}
                  themeVariant="dark"
                  textColor={colors.textPrimary}
                />
              </View>
            </View>
          </Modal>
        )}

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

      <LocationSelector
        value={residenceLocation}
        onChange={setResidenceLocation}
        label={t('editProfile.residenceCity')}
        placeholder={t('editProfile.residenceCityPlaceholder')}
      />

      {isDJ ? (
        <LocationSelector
          value={location}
          onChange={setLocation}
          label={t('editProfile.representedCity')}
          placeholder={t('editProfile.representedCityPlaceholder')}
          restrictToCountries={['FR', 'CH']}
        />
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>{t('editProfile.genres')}</Text>
        <View style={styles.genreGrid}>
          {MUSIC_GENRES.map((genre) => (
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

      {isDJ ? (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.experience')}</Text>
            <View style={styles.optionRow}>
              {experienceOptions.map((opt) => (
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
          <Text style={styles.saveButtonText}>{t('editProfile.save')}</Text>
        )}
      </TouchableOpacity>

      <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>{t('editProfile.cancelWithoutChanges')}</Text>
      </Pressable>
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
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240,239,244,0.2)',
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: 'rgba(240,239,244,0.05)',
    gap: spacing.sm,
  },
  dateValue: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  datePlaceholder: { color: colors.textMuted },
  dateModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dateModalContent: {
    backgroundColor: colors.backgroundElevated ?? colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240,239,244,0.1)',
  },
  dateModalTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  dateModalDone: { padding: spacing.xs },
  dateModalDoneText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.accent,
  },
  usernameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  atPrefix: {
    color: colors.textMuted,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    paddingLeft: spacing.md,
    position: 'absolute',
    zIndex: 1,
    left: 0,
  },
  usernameInput: {
    flex: 1,
    paddingLeft: spacing.xl,
  },
  usernameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  usernameAvailableText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.success,
  },
  usernameCheckingText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  usernameErrorText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: 2,
  },
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
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
});
