import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PlanningStackParamList } from '../../navigation/BroadcasterTabs';
import { eventsService, streamingService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import type { CameraConfig } from '../../types';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '../../config/theme';

type Navigation = NativeStackNavigationProp<PlanningStackParamList, 'CreateEvent'>;
type Route = RouteProp<PlanningStackParamList, 'CreateEvent'>;

export function CreateEventScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const editingId = route.params?.eventId;

  const [title, setTitle] = useState('');
  const [djName, setDjName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraConfig[]>([]);
  const [loadingCameras, setLoadingCameras] = useState(true);

  const displayDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(22, 0, 0, 0);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  useEffect(() => {
    const festivalId = user?.festivalId ?? '';
    streamingService
      .getCamerasByFestival(festivalId)
      .then((cams) => setCameras(cams))
      .catch(() => {})
      .finally(() => setLoadingCameras(false));
  }, [user?.festivalId]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis.');
      return;
    }
    if (!djName.trim()) {
      Alert.alert('Erreur', 'Le nom du DJ est requis.');
      return;
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(22, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);

      await eventsService.createEvent({
        festivalId: user?.festivalId ?? '',
        festivalName: '',
        festivalLogoUrl: null,
        title: title.trim(),
        description: description.trim(),
        djName: djName.trim(),
        coverImageUrl: null,
        scheduledStartTime: startDate.toISOString(),
        scheduledEndTime: endDate.toISOString(),
        actualStartTime: null,
        actualEndTime: null,
        status: 'scheduled',
        cameraId: selectedCamera ?? '',
        playbackUrl: null,
        viewerCount: 0,
      });

      Alert.alert(
        'Event cree avec succes',
        editingId
          ? 'Votre event a ete mis a jour.'
          : 'Votre live a ete programme avec succes.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de creer l\'event.');
    }
  }, [title, djName, description, selectedCamera, user, editingId, navigation]);

  return (
    <ScreenContainer edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          onPress={() => navigation.goBack()}
          size={24}
          color={colors.textPrimary}
        />
        <Text style={styles.headerTitle}>
          {editingId ? 'Modifier le live' : 'Nouveau live'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image placeholder */}
        <Pressable style={styles.imagePlaceholder}>
          <View style={styles.imageIconContainer}>
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.imagePlaceholderText}>Ajouter une image</Text>
          <Text style={styles.imagePlaceholderHint}>Format 16:9 recommande</Text>
        </Pressable>

        {/* Title input */}
        <Input
          label="Titre du live"
          placeholder="Ex: Main Stage - Closing Set"
          value={title}
          onChangeText={setTitle}
          icon="text-outline"
        />

        {/* DJ Name input */}
        <Input
          label="Nom du DJ"
          placeholder="Ex: Boris Brejcha"
          value={djName}
          onChangeText={setDjName}
          icon="musical-notes-outline"
        />

        {/* Date/time display */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Date et heure</Text>
          <Pressable style={styles.dateRow}>
            <View style={styles.dateDisplay}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.textMuted}
                style={styles.dateIcon}
              />
              <Text style={styles.dateText}>{displayDate}</Text>
            </View>
            <Ionicons name="pencil-outline" size={18} color={colors.accentLight} />
          </Pressable>
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description</Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              placeholder="Decrivez votre live..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              selectionColor={colors.accentLight}
            />
          </View>
        </View>

        {/* Camera selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Camera</Text>
          <Text style={styles.fieldHint}>
            Selectionnez la camera pour ce live
          </Text>
          {loadingCameras ? (
            <ActivityIndicator size="small" color={colors.accentLight} />
          ) : cameras.length === 0 ? (
            <Text style={styles.noCamerasText}>Aucune camera configuree</Text>
          ) : (
            <View style={styles.cameraRow}>
              {cameras.map((cam) => {
                const isSelected = selectedCamera === cam.id;
                return (
                  <Pressable
                    key={cam.id}
                    onPress={() => setSelectedCamera(cam.id)}
                    style={[
                      styles.cameraOption,
                      isSelected && styles.cameraOptionSelected,
                    ]}
                  >
                    <Ionicons
                      name="videocam"
                      size={20}
                      color={isSelected ? colors.accentLight : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.cameraLabel,
                        isSelected && styles.cameraLabelSelected,
                      ]}
                    >
                      {cam.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.accentLight}
                        style={styles.cameraCheck}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Submit button */}
        <Button
          title={editingId ? 'Mettre a jour' : 'Programmer le live'}
          onPress={handleSubmit}
          size="lg"
          style={styles.submitButton}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  imagePlaceholder: {
    height: 180,
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  imageIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  imagePlaceholderText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  imagePlaceholderHint: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fieldHint: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  noCamerasText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: spacing.sm,
  },
  dateText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  textAreaWrapper: {
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  textArea: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    minHeight: 100,
    paddingVertical: spacing.md,
  },
  cameraRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cameraOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  cameraOptionSelected: {
    borderColor: colors.accentLight,
    backgroundColor: `${colors.accentLight}10`,
  },
  cameraLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  cameraLabelSelected: {
    color: colors.accentLight,
  },
  cameraCheck: {
    marginLeft: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
