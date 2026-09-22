import React from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '../../config/theme';
import { useFavorites } from '../../contexts/FavoritesContext';

interface LiveActionBarProps {
  eventId: string;
  djAvatarUrl: string | null;
  djName: string;
}

export function LiveActionBar({ eventId, djAvatarUrl, djName }: LiveActionBarProps) {
  const { isFavorite, isLiked, toggleFavorite, toggleLike } = useFavorites();
  const liked = isLiked(eventId);
  const favorited = isFavorite(eventId);

  const handleShare = async () => {
    await Share.share({ message: `Regarde ${djName} en live sur SHUT !` });
  };

  return (
    <View style={styles.container}>
      {/* Avatar DJ */}
      {djAvatarUrl ? (
        <Image source={{ uri: djAvatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>
            {(djName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Like */}
      <Pressable
        testID="action-like"
        style={styles.action}
        onPress={() => toggleLike(eventId)}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={30}
          color={liked ? colors.accent : colors.white}
        />
      </Pressable>

      {/* Partager */}
      <Pressable
        testID="action-share"
        style={styles.action}
        onPress={handleShare}
      >
        <Ionicons name="share-social-outline" size={28} color={colors.white} />
      </Pressable>

      {/* Favoris / Bookmark */}
      <Pressable
        testID="action-favorite"
        style={styles.action}
        onPress={() => toggleFavorite(eventId)}
      >
        <Ionicons
          name={favorited ? 'bookmark' : 'bookmark-outline'}
          size={28}
          color={favorited ? colors.accent : colors.white}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 220, // above chat area
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    zIndex: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(124,58,237,0.4)',
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  action: {
    alignItems: 'center',
  },
});
