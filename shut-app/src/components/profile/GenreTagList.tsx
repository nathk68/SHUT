import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

interface Props {
  genres: string[];
}

export function GenreTagList({ genres }: Props) {
  if (genres.length === 0) return <View />;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {genres.map((genre) => (
        <View key={genre} style={styles.chip}>
          <Text style={styles.label}>{genre}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  chip: {
    backgroundColor: 'rgba(151, 77, 251, 0.15)',
    borderRadius: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
});
