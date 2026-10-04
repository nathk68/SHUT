import React, { useEffect, useState } from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '../../config/theme';
import { useFavorites } from '../../contexts/FavoritesContext';
import { likesService, favoritesService } from '../../services';

interface LiveActionBarProps {
  eventId: string;
  djAvatarUrl: string | null;
  djName: string;
  bottomInset?: number;
}

export function LiveActionBar({ eventId, djAvatarUrl, djName, bottomInset = 0 }: LiveActionBarProps) {
  const { isFavorite, isLiked, toggleFavorite, toggleLike } = useFavorites();
  const liked = isLiked(eventId);
  const favorited = isFavorite(eventId);
  const [likesCount, setLikesCount] = useState(0);
  const [favsCount, setFavsCount] = useState(0);

  useEffect(() => {
    likesService.getLikesCountForItems([eventId]).then(setLikesCount);
    favoritesService.getFavoritesCountForItem(eventId).then(setFavsCount);
  }, [eventId]);

  const handleToggleLike = async () => {
    await toggleLike(eventId);
    setLikesCount((c) => liked ? Math.max(0, c - 1) : c + 1);
  };

  const handleShare = async () => {
    await Share.share({ message: `Regarde ${djName} en live sur SHUT !` });
  };

  return (
    <View style={[styles.container, { bottom: bottomInset + spacing.xl }]}>
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
        onPress={handleToggleLike}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={30}
          color={liked ? colors.accent : colors.white}
        />
        {likesCount > 0 && <Text style={styles.actionCount}>{likesCount}</Text>}
      </Pressable>

      {/* Partager */}
      <Pressable
        testID="action-share"
        style={styles.action}
        onPress={handleShare}
      >
        <Ionicons name="share-social-outline" size={28} color={colors.white} />
      </Pressable>

      {/* Favoris */}
      <Pressable
        testID="action-favorite"
        style={styles.action}
        onPress={() => {
          const wasFav = favorited;
          toggleFavorite(eventId);
          setFavsCount((c) => wasFav ? Math.max(0, c - 1) : c + 1);
        }}
      >
        <Ionicons
          name={favorited ? 'bookmark' : 'bookmark-outline'}
          size={28}
          color={favorited ? colors.accent : colors.white}
        />
        {favsCount > 0 && <Text style={styles.actionCount}>{favsCount}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.md,
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
  actionCount: {
    color: colors.white,
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
