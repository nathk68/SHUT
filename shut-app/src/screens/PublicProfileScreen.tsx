import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LiveStackParamList } from '../navigation/MainTabs';
import { useAuth } from '../contexts/AuthContext';
import { userService, followService, replaysService, likesService } from '../services';
import { DjNotifToggle } from '../components/profile/DjNotifToggle';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { GenreTagList } from '../components/profile/GenreTagList';
import { ReplayList } from '../components/profile/ReplayList';
import { ReportModal } from '../components/report/ReportModal';

import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';
import type { User } from '../types/user';

type Route = RouteProp<LiveStackParamList, 'PublicProfile'>;

export function PublicProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<LiveStackParamList>>();
  const route = useRoute<Route>();
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [reportVisible, setReportVisible] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      userService.getUserById(userId),
      currentUser ? followService.isFollowing(currentUser.id, userId) : Promise.resolve(false),
      followService.getFollowers(userId),
      followService.getFollowing(userId),
      currentUser ? followService.getNotificationsEnabled(currentUser.id, userId) : Promise.resolve(false),
    ])
      .then(([user, following, followers, followingList, notifOn]) => {
        if (cancelled) return;
        setProfileUser(user);
        setIsFollowing(following);
        setFollowersCount(followers.length);
        setFollowingCount(followingList.length);
        setNotifEnabled(notifOn);
        // Compute total likes for broadcasters
        if (user?.role === 'broadcaster') {
          replaysService.getReplaysByUser(user.id).then((replays) => {
            const ids = replays.map((r) => r.id);
            if (ids.length === 0 || cancelled) return;
            likesService.getLikesCountForItems(ids).then((count) => {
              if (!cancelled) setTotalLikes(count);
            });
          });
        }
      })
      .catch((e) => {
        console.warn('[PublicProfile] load error:', e);
        if (!cancelled) setProfileUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, currentUser]);

  const handleFollowPress = useCallback(async () => {
    if (!currentUser || !profileUser) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    try {
      if (wasFollowing) {
        await followService.unfollow(currentUser.id, profileUser.id);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        await followService.follow(currentUser.id, profileUser.id);
        setFollowersCount((c) => c + 1);
      }
    } catch (e) {
      console.warn('[PublicProfile] follow error:', e);
      setIsFollowing(wasFollowing);
    } finally {
      setFollowLoading(false);
    }
  }, [currentUser, profileUser, isFollowing]);

  const handleNotifToggle = useCallback(async () => {
    if (!currentUser || !profileUser) return;
    const next = !notifEnabled;
    setNotifEnabled(next);
    try {
      await followService.setNotificationsEnabled(currentUser.id, profileUser.id, next);
    } catch {
      setNotifEnabled(!next);
    }
  }, [currentUser, profileUser, notifEnabled]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t('profile.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
      <ProfileHeader
        user={{ ...profileUser, totalLikesCount: totalLikes, followersCount, followingCount }}
        isOwnProfile={currentUser?.id === profileUser.id}
        isFollowing={isFollowing}
        followLoading={followLoading}
        onFollowPress={handleFollowPress}
        onFollowersTap={() => navigation.navigate('FollowList' as any, { userId: profileUser.id, mode: 'followers' })}
        onFollowingTap={() => navigation.navigate('FollowList' as any, { userId: profileUser.id, mode: 'following' })}
        notifToggle={
          isFollowing && currentUser?.id !== profileUser.id
            ? <DjNotifToggle enabled={notifEnabled} onToggle={handleNotifToggle} />
            : undefined
        }
      />

      {profileUser.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.bio')}</Text>
          <Text style={styles.bio}>{profileUser.bio}</Text>
        </View>
      ) : null}

      {profileUser.genres && profileUser.genres.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.genres')}</Text>
          <GenreTagList genres={profileUser.genres} />
        </View>
      ) : null}

      {profileUser.role === 'broadcaster' ? (
        <ReplayList
          userId={profileUser.id}
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

      {/* Report button */}
      {currentUser && currentUser.id !== profileUser.id && (
        <Pressable style={styles.reportRow} onPress={() => setReportVisible(true)}>
          <Ionicons name="flag-outline" size={18} color={colors.error} />
          <Text style={styles.reportText}>{t('report.reportUser')}</Text>
        </Pressable>
      )}

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        targetType="user"
        targetId={userId}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.sm },
  sectionTitle: { color: colors.textSecondary, fontFamily: fonts.body.medium, fontSize: fontSize.sm },
  bio: { color: colors.textPrimary, fontFamily: fonts.body.regular, fontSize: fontSize.md, lineHeight: 22 },
  errorText: { color: colors.textSecondary, fontFamily: fonts.body.regular, fontSize: fontSize.md },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  reportText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.error,
  },
});
