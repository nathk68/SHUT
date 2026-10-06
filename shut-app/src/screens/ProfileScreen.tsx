import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParametresStackParamList } from '../navigation/MainTabs';
import { useAuth } from '../contexts/AuthContext';
import { userService, replaysService, likesService, followService } from '../services';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { GenreTagList } from '../components/profile/GenreTagList';
import { ReplayList } from '../components/profile/ReplayList';
import { colors, fonts, fontSize, spacing } from '../config/theme';

type Nav = NativeStackNavigationProp<ParametresStackParamList, 'Profile'>;

export function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useAuth();
  const [totalLikes, setTotalLikes] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    followService.getFollowers(user.id).then((ids) => setFollowersCount(ids.length));
    followService.getFollowing(user.id).then((ids) => setFollowingCount(ids.length));
    if (user.role !== 'broadcaster') return;
    replaysService.getReplaysByUser(user.id).then((replays) => {
      const ids = replays.map((r) => r.id);
      if (ids.length === 0) { setTotalLikes(0); return; }
      likesService.getLikesCountForItems(ids).then(setTotalLikes);
    });
  }, [user?.id, user?.role]);

  const handleAvatarPick = useCallback(async (uri: string) => {
    if (!user) return;
    const url = await userService.uploadAvatar(user.id, uri);
    await updateUser({ avatarUrl: url });
  }, [user, updateUser]);

  const handleEditPress = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.settingsButton} onPress={() => navigation.navigate('SettingsMain')}>
        <Ionicons name="settings-outline" size={28} color={colors.textSecondary} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <ProfileHeader
          user={{ ...user, totalLikesCount: totalLikes, followersCount, followingCount }}
          isOwnProfile
          onEditPress={handleEditPress}
          onAvatarPick={handleAvatarPick}
          onFollowersTap={() => (navigation as any).navigate('FollowList', { userId: user.id, mode: 'followers' })}
          onFollowingTap={() => (navigation as any).navigate('FollowList', { userId: user.id, mode: 'following' })}
        />

        {user.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.bio')}</Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        ) : null}

        {user.genres && user.genres.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.genres')}</Text>
            <GenreTagList genres={user.genres} />
          </View>
        ) : null}

        {user.role === 'broadcaster' ? (
          <ReplayList
            userId={user.id}
            onPress={(replay) => {
              (navigation as any).navigate('ReplayPlayer', {
                playbackUrl: replay.playbackUrl,
                title: replay.title || t('common.replay'),
                trimStart: replay.trimStart ?? 0,
                trimEnd: replay.trimEnd ?? 0,
                replayId: replay.id,
                djUserId: replay.userId,
                eventId: replay.eventId,
              });
            }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  settingsButton: {
    position: 'absolute',
    top: spacing.xxl + spacing.lg - spacing.sm,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  content: { paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.sm },
  sectionTitle: { color: colors.textSecondary, fontFamily: fonts.body.medium, fontSize: fontSize.sm },
  bio: { color: colors.textPrimary, fontFamily: fonts.body.regular, fontSize: fontSize.md, lineHeight: 22 },
});
