import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SocialLinks as SocialLinksType } from '../../types/profile';
import { colors, spacing } from '../../config/theme';

const PLATFORM_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  soundcloud: 'musical-notes-outline',
  mixcloud: 'radio-outline',
  youtube: 'logo-youtube',
  twitter: 'logo-twitter',
  facebook: 'logo-facebook',
  tiktok: 'logo-tiktok',
  spotify: 'musical-note-outline',
};

const PLATFORM_URLS: Record<string, (handle: string) => string> = {
  instagram: (h) => `https://instagram.com/${h}`,
  soundcloud: (h) => `https://soundcloud.com/${h}`,
  mixcloud: (h) => `https://mixcloud.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  twitter: (h) => `https://twitter.com/${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  spotify: (h) => `https://open.spotify.com/artist/${h}`,
};

interface Props {
  links: SocialLinksType;
}

export function SocialLinks({ links }: Props) {
  const entries = Object.entries(links).filter(([, val]) => Boolean(val));
  if (entries.length === 0) return <View />;
  return (
    <View style={styles.row}>
      {entries.map(([platform, handle]) => (
        <Pressable
          key={platform}
          testID={`social-${platform}`}
          style={styles.icon}
          onPress={() => Linking.openURL(PLATFORM_URLS[platform]?.(handle ?? '') ?? '')}
        >
          <Ionicons name={PLATFORM_ICONS[platform] ?? 'link-outline'} size={22} color={colors.textPrimary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  icon: { padding: spacing.xs },
});
