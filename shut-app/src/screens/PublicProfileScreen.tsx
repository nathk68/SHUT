import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { LiveStackParamList } from '../navigation/MainTabs';
import { useAuth } from '../contexts/AuthContext';
import { userService, followService } from '../services';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { GenreTagList } from '../components/profile/GenreTagList';
import { SocialLinks } from '../components/profile/SocialLinks';
import { colors, fonts, fontSize, spacing } from '../config/theme';
import type { User } from '../types/user';

type Route = RouteProp<LiveStackParamList, 'PublicProfile'>;

export function PublicProfileScreen() {
  const route = useRoute<Route>();
  const { userId } = route.params;
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      userService.getUserById(userId),
      currentUser ? followService.isFollowing(currentUser.id, userId) : Promise.resolve(false),
    ])
      .then(([user, following]) => {
        if (cancelled) return;
        setProfileUser(user);
        setIsFollowing(following);
      })
      .catch(() => {
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
        setProfileUser((prev) => prev ? { ...prev, followersCount: Math.max(0, (prev.followersCount ?? 1) - 1) } : prev);
      } else {
        await followService.follow(currentUser.id, profileUser.id);
        setProfileUser((prev) => prev ? { ...prev, followersCount: (prev.followersCount ?? 0) + 1 } : prev);
      }
    } catch {
      setIsFollowing(wasFollowing);
    } finally {
      setFollowLoading(false);
    }
  }, [currentUser, profileUser, isFollowing]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Profil introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfileHeader
        user={profileUser}
        isOwnProfile={currentUser?.id === profileUser.id}
        isFollowing={isFollowing}
        followLoading={followLoading}
        onFollowPress={handleFollowPress}
      />

      {profileUser.bio ? (
        <View style={styles.section}>
          <Text style={styles.bio}>{profileUser.bio}</Text>
        </View>
      ) : null}

      {profileUser.genres && profileUser.genres.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres</Text>
          <GenreTagList genres={profileUser.genres} />
        </View>
      ) : null}

      {profileUser.socialLinks && Object.values(profileUser.socialLinks).some(Boolean) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réseaux</Text>
          <SocialLinks links={profileUser.socialLinks} />
        </View>
      ) : null}
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
});
