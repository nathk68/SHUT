import React, { useState, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

export function FestivalSetupScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du festival est requis.');
      return;
    }

    setLoading(true);
    try {
      // Create the festival document
      const festivalRef = await addDoc(collection(db, 'festivals'), {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        logoUrl: null,
        coverImageUrl: null,
        ownerId: user?.id ?? '',
        cameras: [],
        createdAt: new Date().toISOString(),
      });

      // Link the festival to the user
      await updateDoc(doc(db, 'users', user?.id ?? ''), {
        festivalId: festivalRef.id,
      });

      // Refresh auth context so RootNavigator re-routes
      await refreshUser();
    } catch (error) {
      console.error('Festival creation error:', error);
      Alert.alert('Erreur', 'Impossible de créer le festival. Vérifiez vos règles Firestore.');
    } finally {
      setLoading(false);
    }
  }, [name, description, location, user, refreshUser]);

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="musical-notes" size={48} color={colors.accentLight} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Créez votre festival</Text>
          <Text style={styles.subtitle}>
            Ces informations seront visibles par vos spectateurs.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Nom du festival"
              placeholder="Ex: Nuit Sonore, Sonar, Dour..."
              value={name}
              onChangeText={setName}
              icon="flag-outline"
            />
            <Input
              label="Ville / Lieu"
              placeholder="Ex: Lyon, France"
              value={location}
              onChangeText={setLocation}
              icon="location-outline"
            />
            <Input
              label="Description (optionnel)"
              placeholder="Présentez votre festival en quelques mots..."
              value={description}
              onChangeText={setDescription}
              icon="document-text-outline"
            />
          </View>

          <Button
            title={loading ? 'Création...' : 'Créer le festival'}
            onPress={handleCreate}
            size="lg"
            style={styles.button}
          />

          <Button
            title="Se déconnecter"
            onPress={logout}
            variant="ghost"
            size="md"
            style={styles.logoutButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${colors.accentLight}15`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.accentLight}30`,
  },
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.hero,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  button: {
    marginBottom: spacing.md,
  },
  logoutButton: {
    opacity: 0.6,
  },
});
