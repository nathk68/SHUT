import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Header } from '../../components/layout/Header';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';
import { copyToClipboard } from '../../utils/clipboard';
import { streamingService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { CameraConfig } from '../../types';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '../../config/theme';

function truncateKey(key: string): string {
  return key.substring(0, 8) + '...';
}

export function CameraManagerScreen() {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<CameraConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCameras = useCallback(async () => {
    try {
      setLoading(true);
      const result = await streamingService.getCamerasByFestival(user?.festivalId ?? '');
      setCameras(result);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les cameras.');
    } finally {
      setLoading(false);
    }
  }, [user?.festivalId]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleCopyKey = (key: string) => {
    copyToClipboard(key);
  };

  const handleRegenerateKey = (camera: CameraConfig) => {
    Alert.alert(
      'Regenerer la cle',
      `Regenerer la cle de stream pour "${camera.label}" ? L'ancienne cle ne fonctionnera plus.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Regenerer',
          style: 'destructive',
          onPress: async () => {
            try {
              await streamingService.regenerateStreamKey(camera.id);
              await fetchCameras();
              Alert.alert('Cle regeneree', 'La nouvelle cle a ete generee avec succes.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de regenerer la cle.');
            }
          },
        },
      ],
    );
  };

  const handleDeleteCamera = (camera: CameraConfig) => {
    Alert.alert(
      'Supprimer la camera',
      `Supprimer la camera "${camera.label}" ? Cette action est irreversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await streamingService.removeCamera(camera.id);
              await fetchCameras();
              Alert.alert('Camera supprimee', 'La camera a ete supprimee avec succes.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la camera.');
            }
          },
        },
      ],
    );
  };

  const handleAddCamera = () => {
    Alert.prompt(
      'Ajouter une camera',
      'Entrez le nom de la nouvelle camera.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ajouter',
          onPress: async (label?: string) => {
            if (!label?.trim()) {
              Alert.alert('Erreur', 'Le nom de la camera est requis.');
              return;
            }
            try {
              await streamingService.addCamera({
                festivalId: user?.festivalId ?? '',
                label: label.trim(),
                rtmpUrl: '',
                streamKey: '',
                isLinkedHardware: false,
                hardwareSerial: null,
              });
              await fetchCameras();
              Alert.alert('Camera ajoutee', 'La nouvelle camera a ete ajoutee avec succes.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'ajouter la camera.');
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const renderCamera = ({ item }: { item: CameraConfig }) => (
    <GlassCard style={styles.cameraCard}>
      {/* Camera header */}
      <View style={styles.cameraHeader}>
        <View style={styles.cameraIcon}>
          <Ionicons
            name="videocam"
            size={22}
            color={item.isLinkedHardware ? colors.accentLight : colors.textSecondary}
          />
        </View>
        <View style={styles.cameraInfo}>
          <Text style={styles.cameraLabel}>{item.label}</Text>
          {item.hardwareSerial && (
            <Text style={styles.cameraSerial}>{item.hardwareSerial}</Text>
          )}
        </View>
        <Badge
          label={item.isLinkedHardware ? 'SHUT' : 'Externe'}
          color={item.isLinkedHardware ? colors.accentLight : colors.textMuted}
        />
      </View>

      {/* Stream key */}
      <View style={styles.keySection}>
        <Text style={styles.keyLabel}>Cle de stream</Text>
        <View style={styles.keyRow}>
          <View style={styles.keyDisplay}>
            <Text style={styles.keyValue}>{truncateKey(item.streamKey)}</Text>
          </View>
          <View style={styles.keyActions}>
            <IconButton
              icon="copy-outline"
              onPress={() => handleCopyKey(item.streamKey)}
              size={18}
              color={colors.accentLight}
              style={styles.keyActionButton}
            />
            <IconButton
              icon="refresh-outline"
              onPress={() => handleRegenerateKey(item)}
              size={18}
              color={colors.warning}
              style={styles.keyActionButton}
            />
          </View>
        </View>
      </View>

      {/* Status indicator */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: item.isLinkedHardware
                ? colors.success
                : colors.textMuted,
            },
          ]}
        />
        <Text
          style={[
            styles.statusText,
            {
              color: item.isLinkedHardware
                ? colors.success
                : colors.textMuted,
            },
          ]}
        >
          {item.isLinkedHardware ? 'Connectee' : 'Hors ligne'}
        </Text>
      </View>
    </GlassCard>
  );

  return (
    <ScreenContainer>
      <Header
        title="Cameras"
        right={
          <IconButton
            icon="add-circle-outline"
            onPress={handleAddCamera}
            size={26}
            color={colors.accentLight}
          />
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentLight} />
          <Text style={styles.loadingText}>Chargement des cameras...</Text>
        </View>
      ) : (
      <FlatList
        data={cameras}
        keyExtractor={(item) => item.id}
        renderItem={renderCamera}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              {cameras.length} camera{cameras.length > 1 ? 's' : ''} configuree{cameras.length > 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="videocam-off-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune camera</Text>
            <Text style={styles.emptyText}>
              Ajoutez votre premiere camera pour commencer a diffuser.
            </Text>
          </GlassCard>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <GlassCard style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb-outline" size={18} color={colors.warning} />
                <Text style={styles.tipTitle}>Astuce</Text>
              </View>
              <Text style={styles.tipText}>
                Connectez une camera SHUT pour une integration automatique. Les
                cameras externes necessitent une configuration manuelle via OBS
                ou un encodeur RTMP compatible.
              </Text>
            </GlassCard>

            <Button
              title="Ajouter une camera"
              onPress={handleAddCamera}
              variant="secondary"
              size="lg"
              style={styles.addButton}
            />
          </View>
        }
      />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  listHeaderText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cameraCard: {
    marginBottom: spacing.md,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cameraIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cameraInfo: {
    flex: 1,
  },
  cameraLabel: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  cameraSerial: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  keySection: {
    marginBottom: spacing.md,
  },
  keyLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyDisplay: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  keyValue: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  keyActions: {
    flexDirection: 'row',
    marginLeft: spacing.sm,
  },
  keyActionButton: {
    backgroundColor: colors.backgroundInput,
    marginLeft: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
  footer: {
    marginTop: spacing.md,
  },
  tipCard: {
    marginBottom: spacing.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  tipText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  addButton: {
    marginBottom: spacing.lg,
  },
});
