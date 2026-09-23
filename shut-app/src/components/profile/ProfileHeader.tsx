import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { User } from '../../types/user';
import { AvatarPicker } from './AvatarPicker';
import { ExperienceTag } from './ExperienceTag';
import { FollowButton } from './FollowButton';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

interface Props {
  user: User;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  followLoading?: boolean;
  onEditPress?: () => void;
  onFollowPress?: () => void;
  onAvatarPick?: (uri: string) => void;
}

export function ProfileHeader({ user, isOwnProfile, isFollowing = false, followLoading = false, onEditPress, onFollowPress, onAvatarPick }: Props) {
  const displayLabel = user.artistName ?? user.displayName;

  return (
    <View style={styles.container}>
      <AvatarPicker
        avatarUrl={user.avatarUrl ?? null}
        displayName={displayLabel}
        editable={isOwnProfile}
        size={88}
        onPick={onAvatarPick}
      />
      <Text style={styles.name}>{displayLabel}</Text>
      {user.username ? <Text style={styles.username}>@{user.username}</Text> : null}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{user.followersCount ?? 0}</Text>
          <Text style={styles.statLabel}>Abonnés</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{user.followingCount ?? 0}</Text>
          <Text style={styles.statLabel}>Abonnements</Text>
        </View>
      </View>

      {user.experience ? <ExperienceTag level={user.experience} /> : null}

      <View style={styles.actions}>
        {isOwnProfile ? (
          <Pressable testID="edit-profile-button" style={styles.editButton} onPress={onEditPress}>
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </Pressable>
        ) : (
          <FollowButton isFollowing={isFollowing} onPress={onFollowPress ?? (() => {})} loading={followLoading} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  name: { color: colors.textPrimary, fontFamily: fonts.heading.bold, fontSize: fontSize.xl },
  username: { color: colors.textSecondary, fontFamily: fonts.body.regular, fontSize: fontSize.sm },
  stats: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stat: { alignItems: 'center' },
  statValue: { color: colors.textPrimary, fontFamily: fonts.heading.bold, fontSize: fontSize.lg },
  statLabel: { color: colors.textSecondary, fontFamily: fonts.body.regular, fontSize: fontSize.xs },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(240,239,244,0.2)' },
  actions: { flexDirection: 'row', gap: spacing.md },
  editButton: {
    borderWidth: 1,
    borderColor: 'rgba(240,239,244,0.3)',
    borderRadius: 100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  editButtonText: { color: colors.textPrimary, fontFamily: fonts.body.medium, fontSize: fontSize.sm },
});
