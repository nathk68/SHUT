import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

interface Props {
  isFollowing: boolean;
  onPress: () => void;
  loading?: boolean;
}

export function FollowButton({ isFollowing, onPress, loading = false }: Props) {
  return (
    <Pressable
      testID="follow-button"
      style={[styles.button, isFollowing ? styles.following : styles.notFollowing]}
      onPress={loading ? undefined : onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFollowing ? colors.textPrimary : colors.white} />
      ) : (
        <Text style={[styles.label, isFollowing ? styles.labelFollowing : styles.labelNotFollowing]}>
          {isFollowing ? 'Suivi' : 'Suivre'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  notFollowing: { backgroundColor: colors.accent },
  following: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent },
  label: { fontFamily: fonts.heading.bold, fontSize: fontSize.sm },
  labelNotFollowing: { color: colors.white },
  labelFollowing: { color: colors.accent },
});
