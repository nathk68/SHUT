import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParametresStackParamList } from '../navigation/MainTabs';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { GenreTagList } from '../components/profile/GenreTagList';
import { SocialLinks } from '../components/profile/SocialLinks';
import { colors, fonts, fontSize, spacing } from '../config/theme';

type Nav = NativeStackNavigationProp<ParametresStackParamList, 'Profile'>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useAuth();

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfileHeader
        user={user}
        isOwnProfile
        onEditPress={handleEditPress}
        onAvatarPick={handleAvatarPick}
      />

      {user.bio ? (
        <View style={styles.section}>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      ) : null}

      {user.genres && user.genres.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres</Text>
          <GenreTagList genres={user.genres} />
        </View>
      ) : null}

      {user.socialLinks && Object.values(user.socialLinks).some(Boolean) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réseaux</Text>
          <SocialLinks links={user.socialLinks} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.sm },
  sectionTitle: { color: colors.textSecondary, fontFamily: fonts.body.medium, fontSize: fontSize.sm },
  bio: { color: colors.textPrimary, fontFamily: fonts.body.regular, fontSize: fontSize.md, lineHeight: 22 },
});
