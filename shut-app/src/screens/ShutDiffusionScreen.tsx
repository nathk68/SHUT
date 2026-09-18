import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SearchableDropdown } from '../components/ui/SearchableDropdown';
import { WorldMapSVG } from '../components/ui/WorldMapSVG';
import {
  COUNTRIES,
  CITIES,
  DJ_PROFILES,
  DJProfile,
  getRegionsForCountry,
  getCitiesForRegion,
  getCitiesForCountry,
  getDJsForCity,
  getDJsForRegion,
  getDJsForCountry,
} from '../services/_mock-data/countries';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

// ─── Genre badge colors ────────────────────────────────────────────────────────

const GENRE_COLORS: Record<string, string> = {
  Techno: colors.accent,
  House: '#E07B39',
  Progressive: '#5B8FF9',
  Minimal: '#4ECDC4',
  Other: colors.textMuted,
};

// ─── DJ profile card ──────────────────────────────────────────────────────────

function DJCard({ dj }: { dj: DJProfile }) {
  const city = CITIES.find((c) => c.id === dj.cityId);
  const country = COUNTRIES.find((c) => c.code === dj.countryCode);
  const initials = dj.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const genreColor = GENRE_COLORS[dj.genre] ?? colors.textMuted;

  return (
    <View style={cardStyles.card}>
      <View style={[cardStyles.avatar, { backgroundColor: genreColor + '33' }]}>
        <Text style={[cardStyles.avatarText, { color: genreColor }]}>{initials}</Text>
      </View>
      <View style={cardStyles.info}>
        <Text style={cardStyles.name}>{dj.name}</Text>
        <Text style={cardStyles.location}>
          {country?.flag} {city?.name ?? '—'}
        </Text>
      </View>
      <View style={[cardStyles.genreBadge, { borderColor: genreColor }]}>
        <Text style={[cardStyles.genreText, { color: genreColor }]}>{dj.genre}</Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  location: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  genreBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  genreText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xs,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ShutDiffusionScreen() {
  const navigation = useNavigation<any>();
  const { width: screenWidth } = useWindowDimensions();

  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDJ, setSelectedDJ] = useState<string | null>(null);
  const [showDJResults, setShowDJResults] = useState(false);

  const countryOptions = COUNTRIES.map((c) => ({ id: c.code, label: c.name, prefix: c.flag }));

  const regionOptions = selectedCountry
    ? getRegionsForCountry(selectedCountry).map((r) => ({ id: r.id, label: r.name }))
    : [];

  const cityOptions = (() => {
    if (selectedRegion) return getCitiesForRegion(selectedRegion).map((c) => ({ id: c.id, label: c.name }));
    if (selectedCountry) return getCitiesForCountry(selectedCountry).map((c) => ({ id: c.id, label: c.name }));
    return [];
  })();

  const djOptions = (() => {
    let djs = DJ_PROFILES;
    if (selectedCity) djs = getDJsForCity(selectedCity);
    else if (selectedRegion) djs = getDJsForRegion(selectedRegion);
    else if (selectedCountry) djs = getDJsForCountry(selectedCountry);
    return [
      { id: 'all', label: 'Tous les DJs' },
      ...djs.map((dj) => ({ id: dj.id, label: dj.name })),
    ];
  })();

  function handleCountrySelect(code: string) {
    setSelectedCountry(code);
    setSelectedRegion(null);
    setSelectedCity(null);
    setSelectedDJ(null);
    setShowDJResults(false);
  }

  function handleRegionSelect(regionId: string) {
    setSelectedRegion(regionId);
    setSelectedCity(null);
    setSelectedDJ(null);
    setShowDJResults(false);
  }

  function handleCitySelect(cityId: string) {
    setSelectedCity(cityId);
    setSelectedDJ(null);
    setShowDJResults(false);
  }

  function getFilteredDJs(): DJProfile[] {
    if (selectedDJ && selectedDJ !== 'all') {
      const found = DJ_PROFILES.find((dj) => dj.id === selectedDJ);
      return found ? [found] : [];
    }
    if (selectedCity) return getDJsForCity(selectedCity);
    if (selectedRegion) return getDJsForRegion(selectedRegion);
    if (selectedCountry) return getDJsForCountry(selectedCountry);
    return DJ_PROFILES;
  }

  function handleViewLives() {
    setShowDJResults(false);
    if (selectedCountry) {
      navigation.navigate('Live', { countryCode: selectedCountry });
    } else {
      navigation.navigate('Live');
    }
  }

  function handleSearchDJs() {
    setShowDJResults(true);
  }

  const filteredDJs = showDJResults ? getFilteredDJs() : [];

  // Full screen width (container uses negative margins to break out of content padding)
  const mapWidth = screenWidth;
  const mapHeight = Math.round(mapWidth * (375 / 960));

  return (
    <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.title}>
        {'SHUT '}
        <Text style={styles.titleAccent}>DIFFUSION</Text>
      </Text>
      <Text style={styles.subtitle}>
        Découvrez les pays partenaires et leurs scènes live.
      </Text>

      {/* World map — full width, no border, same background as page */}
      <View style={[styles.mapContainer, { height: mapHeight + 28 }]}>
        <WorldMapSVG
          width={mapWidth}
          height={mapHeight}
          selectedCode={selectedCountry}
          onCountryPress={handleCountrySelect}
        />

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendText}>Pays partenaires</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1c1b2e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }]} />
            <Text style={styles.legendText}>À venir</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <SearchableDropdown
          options={countryOptions}
          label="Choisir un pays"
          value={selectedCountry ?? undefined}
          onSelect={handleCountrySelect}
          leftIcon="globe-outline"
        />

        <SearchableDropdown
          key={selectedCountry ?? 'no-country'}
          options={regionOptions}
          label="Choisir une région"
          onSelect={handleRegionSelect}
          disabled={!selectedCountry}
          leftIcon="map-outline"
        />

        <SearchableDropdown
          key={(selectedRegion ?? selectedCountry ?? '') + '-city'}
          options={cityOptions}
          label="Choisir une ville"
          onSelect={handleCitySelect}
          disabled={!selectedCountry}
          leftIcon="location-outline"
        />

        <SearchableDropdown
          key={(selectedCity ?? selectedRegion ?? '') + '-dj'}
          options={djOptions}
          label="Choisir un DJ"
          onSelect={setSelectedDJ}
          disabled={false}
          leftIcon="person-outline"
        />
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleViewLives}
          style={({ pressed }) => [styles.button, styles.buttonOutline, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="videocam-outline" size={16} color={colors.accent} />
          <Text style={[styles.buttonText, styles.buttonTextOutline]}>Voir les lives</Text>
        </Pressable>

        <Pressable
          onPress={handleSearchDJs}
          style={({ pressed }) => [styles.button, styles.buttonFilled, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="people-outline" size={16} color={colors.white} />
          <Text style={styles.buttonText}>Rechercher des DJs</Text>
        </Pressable>
      </View>

      {/* DJ results */}
      {showDJResults && (
        <View
          style={styles.djResults}
          onLayout={(e) =>
            scrollViewRef.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: true })
          }
        >
          <Text style={styles.djResultsTitle}>
            {filteredDJs.length} DJ{filteredDJs.length !== 1 ? 's' : ''} trouvé{filteredDJs.length !== 1 ? 's' : ''}
          </Text>
          {filteredDJs.length === 0 ? (
            <Text style={styles.djResultsEmpty}>Aucun DJ trouvé pour cette sélection.</Text>
          ) : (
            <View style={styles.djList}>
              {filteredDJs.map((dj) => (
                <DJCard key={dj.id} dj={dj} />
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  titleAccent: {
    color: colors.accent,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  mapContainer: {
    backgroundColor: colors.background,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  filters: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: 100,
    paddingVertical: spacing.md,
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
  },
  buttonFilled: {
    backgroundColor: colors.accent,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  buttonTextOutline: {
    color: colors.accent,
  },
  djResults: {
    gap: spacing.md,
  },
  djResultsTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  djResultsEmpty: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  djList: {
    gap: spacing.sm,
  },
});
