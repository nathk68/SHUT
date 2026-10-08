import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../types/user';
import { AvatarPicker } from './AvatarPicker';
import { ExperienceTag } from './ExperienceTag';
import { FollowButton } from './FollowButton';
import { SocialLinks } from './SocialLinks';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

interface Props {
  user: User;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  followLoading?: boolean;
  onEditPress?: () => void;
  onFollowPress?: () => void;
  onAvatarPick?: (uri: string) => void;
  onFollowersTap?: () => void;
  onFollowingTap?: () => void;
  notifToggle?: React.ReactNode;
}

export function ProfileHeader({ user, isOwnProfile, isFollowing = false, followLoading = false, onEditPress, onFollowPress, onAvatarPick, onFollowersTap, onFollowingTap, notifToggle }: Props) {
  const { t } = useTranslation();
  const displayLabel = user.artistName ?? user.firstName ?? user.displayName;
  const hasSocials = user.socialLinks && Object.values(user.socialLinks).some(Boolean);

  return (
    <View style={styles.container}>
      <AvatarPicker
        avatarUrl={user.avatarUrl ?? null}
        displayName={displayLabel}
        editable={isOwnProfile}
        size={88}
        onPick={onAvatarPick}
      />
      <View style={styles.nameGroup}>
        <Text style={styles.name}>{displayLabel}</Text>
        {user.username ? <Text style={styles.username}>@{user.username}</Text> : null}
        {user.representedCityName ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={styles.locationText}>
              {user.representedCountryCode ? countryFlag(user.representedCountryCode) + ' ' : ''}
              {user.representedCityName}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.stats}>
        <Pressable style={styles.stat} onPress={onFollowersTap}>
          <Text style={styles.statValue}>{user.followersCount ?? 0}</Text>
          <Text style={styles.statLabel}>{t('followList.followers')}</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable style={styles.stat} onPress={onFollowingTap}>
          <Text style={styles.statValue}>{user.followingCount ?? 0}</Text>
          <Text style={styles.statLabel}>{t('followList.following')}</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{user.totalLikesCount ?? 0}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>

      <View style={[styles.metaRow, !user.experience && styles.metaRowCenter]}>
        {user.experience ? <ExperienceTag level={user.experience} /> : null}
        {isOwnProfile ? (
          <Pressable testID="edit-profile-button" style={styles.editButton} onPress={onEditPress}>
            <Text style={styles.editButtonText}>{t('profile.editProfile')}</Text>
          </Pressable>
        ) : (
          <>
            <FollowButton isFollowing={isFollowing} onPress={onFollowPress ?? (() => {})} loading={followLoading} />
            {notifToggle}
          </>
        )}
      </View>

      {hasSocials ? (
        <View style={styles.socials}>
          <SocialLinks links={user.socialLinks!} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  nameGroup: { alignItems: 'center', gap: 2 },
  name: { color: colors.textPrimary, fontFamily: fonts.heading.bold, fontSize: fontSize.xl },
  username: { color: colors.textMuted, fontFamily: fonts.body.regular, fontSize: fontSize.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { color: colors.textMuted, fontFamily: fonts.body.regular, fontSize: fontSize.xs },
  stats: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stat: { alignItems: 'center' },
  statValue: { color: colors.textPrimary, fontFamily: fonts.heading.bold, fontSize: fontSize.lg },
  statLabel: { color: colors.textSecondary, fontFamily: fonts.body.regular, fontSize: fontSize.xs },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(240,239,244,0.2)' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg,
  },
  metaRowCenter: {},
  editButton: {
    borderWidth: 1,
    borderColor: 'rgba(240,239,244,0.3)',
    borderRadius: 100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  editButtonText: { color: colors.textPrimary, fontFamily: fonts.body.medium, fontSize: fontSize.sm },
  socials: { alignSelf: 'stretch', paddingHorizontal: spacing.lg, alignItems: 'center' },
});
