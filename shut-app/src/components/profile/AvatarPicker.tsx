import React, { useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize } from '../../config/theme';

interface Props {
  avatarUrl: string | null;
  displayName?: string;
  editable?: boolean;
  size?: number;
  onPick?: (uri: string) => void;
}

export function AvatarPicker({ avatarUrl, displayName = '', editable = false, size = 80, onPick }: Props) {
  const initial = (displayName[0] ?? '?').toUpperCase();

  const handlePick = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      onPick?.(result.assets[0].uri);
    }
  }, [onPick]);

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {avatarUrl ? (
        <Image
          testID="avatar-image"
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          testID="avatar-placeholder"
          style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
        </View>
      )}
      {editable && (
        <Pressable testID="avatar-edit-button" style={styles.editOverlay} onPress={handlePick}>
          <Ionicons name="camera-outline" size={size * 0.3} color={colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', position: 'relative' },
  image: { resizeMode: 'cover' },
  placeholder: {
    backgroundColor: 'rgba(151, 77, 251, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    paddingVertical: 4,
  },
});
