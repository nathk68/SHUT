import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences, type VideoQuality } from '../../contexts/PreferencesContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

const OPTIONS: { value: VideoQuality; label: string; desc: string }[] = [
  { value: 'auto', label: 'Automatique', desc: 'S\'adapte à ta connexion' },
  { value: '720p', label: '720p — HD', desc: 'Haute définition, recommandé Wi-Fi' },
  { value: '480p', label: '480p — SD', desc: 'Bonne qualité, économe en data' },
  { value: '360p', label: '360p — Bas débit', desc: 'Connexions lentes ou instables' },
];

export function QualityScreen() {
  const navigation = useNavigation();
  const { videoQuality, setVideoQuality } = usePreferences();

  const handleSelect = async (quality: VideoQuality) => {
    await setVideoQuality(quality);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Qualité vidéo</Text>
      </View>

      <View style={styles.card}>
        {OPTIONS.map((opt, i) => (
          <Pressable
            key={opt.value}
            style={({ pressed }) => [
              styles.row,
              i === OPTIONS.length - 1 && styles.rowLast,
              pressed && styles.rowPressed,
            ]}
            onPress={() => handleSelect(opt.value)}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.label}>{opt.label}</Text>
              <Text style={styles.desc}>{opt.desc}</Text>
            </View>
            {videoQuality === opt.value ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            ) : (
              <View style={styles.circle} />
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.note}>
        La qualité s'applique aux prochains lives et rediffusions. En mode automatique,
        le lecteur s'adapte en temps réel à ta bande passante.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  back: { padding: spacing.xs },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
  },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  rowLeft: { flex: 1, gap: 2, marginRight: spacing.md },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
  },
  desc: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  note: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    textAlign: 'center',
  },
});
