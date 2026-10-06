import React, { useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

// ─── Public interface (backward-compatible) ───────────────────────────────────

export interface LocationValue {
  countryCode?: string;
  cityId?: string;
  cityName?: string;
}

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  restrictToCountries?: string[];
}

// ─── Country code → flag emoji ────────────────────────────────────────────────

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

// ─── Photon (OpenStreetMap) search ────────────────────────────────────────────

interface SearchResult {
  key: string;
  cityName: string;
  countryCode: string;
  countryName: string;
  stateName: string;
  flag: string;
}

async function searchCities(query: string, limit = 20, lang = 'fr'): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}&lang=${lang}&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    const seen = new Set<string>();
    const results: SearchResult[] = [];

    for (const feature of data.features ?? []) {
      const p = feature.properties;
      if (!p?.name || !p?.countrycode) continue;

      const cc = p.countrycode.toUpperCase();
      const dedup = `${p.name}__${cc}`;
      if (seen.has(dedup)) continue;
      seen.add(dedup);

      results.push({
        key: `${cc}__${p.state ?? ''}__${p.name}`,
        cityName: p.name,
        countryCode: cc,
        countryName: p.country ?? cc,
        stateName: p.state ?? p.county ?? '',
        flag: countryFlag(cc),
      });
    }
    return results;
  } catch {
    return [];
  }
}

// ─── Partner country names (resolved via i18n) ──────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

export function LocationSelector({
  value,
  onChange,
  label,
  placeholder,
  error,
  restrictToCountries,
}: Props) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('location.label');
  const resolvedPlaceholder = placeholder ?? t('location.placeholder');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const display = value.cityName
    ? { flag: value.countryCode ? countryFlag(value.countryCode) : '', label: `${value.cityName}${value.countryCode ? `, ${value.countryCode}` : ''}` }
    : null;

  const handleOpen = useCallback(() => {
    setSearchText('');
    setResults([]);
    setSearching(false);
    setModalVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleModalShow = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const fetchLimit = restrictToCountries?.length ? 80 : 20;
      let res = await searchCities(text, fetchLimit, i18n.language);
      if (restrictToCountries?.length) {
        res = res.filter(r => restrictToCountries.includes(r.countryCode));
      }
      setResults(res);
      setSearching(false);
    }, 400);
  }, [restrictToCountries]);

  const handleSelect = useCallback((item: SearchResult) => {
    onChange({
      countryCode: item.countryCode,
      cityId: item.key,
      cityName: item.cityName,
    });
    setModalVisible(false);
  }, [onChange]);

  const handleSelectCountry = useCallback((code: string) => {
    onChange({ countryCode: code, cityName: t(`common.countries.${code}`, { defaultValue: code }) });
    setModalVisible(false);
  }, [onChange, t]);

  const countryOptions = restrictToCountries?.map(code => ({
    code,
    name: t(`common.countries.${code}`, { defaultValue: code }),
    flag: countryFlag(code),
  }));

  const handleClear = useCallback(() => {
    onChange({});
  }, [onChange]);

  const renderItem = useCallback(({ item }: { item: SearchResult }) => (
    <Pressable
      onPress={() => handleSelect(item)}
      style={({ pressed }) => [styles.resultItem, pressed && styles.resultItemPressed]}
    >
      <Text style={styles.resultFlag}>{item.flag}</Text>
      <View style={styles.resultTextWrap}>
        <Text style={styles.resultCity}>{item.cityName}</Text>
        <Text style={styles.resultRegion}>
          {item.stateName ? `${item.stateName}, ` : ''}{item.countryName}
        </Text>
      </View>
    </Pressable>
  ), [handleSelect]);

  const keyExtractor = useCallback((item: SearchResult) => item.key, []);

  return (
    <View style={styles.container}>
      {resolvedLabel ? <Text style={styles.label}>{resolvedLabel}</Text> : null}

      <Pressable onPress={handleOpen} style={[styles.trigger, error && styles.triggerError]}>
        <Ionicons name="location-outline" size={18} color={colors.textMuted} />
        {display ? (
          <>
            <Text style={styles.triggerFlag}>{display.flag}</Text>
            <Text style={styles.triggerText} numberOfLines={1}>{display.label}</Text>
            <Pressable
              onPress={(e) => { e.stopPropagation(); handleClear(); }}
              hitSlop={8}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          </>
        ) : (
          <Text style={styles.triggerPlaceholder}>{resolvedPlaceholder}</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleClose}
        onShow={handleModalShow}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('location.selectCity')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder={t('location.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={handleSearchChange}
              autoFocus
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => { setSearchText(''); setResults([]); setSearching(false); }} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {searchText.length === 0 && countryOptions ? (
            <View style={styles.resultsList}>
              <Text style={styles.sectionLabel}>{t('location.partnerCountries')}</Text>
              {countryOptions.map(c => (
                <Pressable
                  key={c.code}
                  onPress={() => handleSelectCountry(c.code)}
                  style={({ pressed }) => [styles.resultItem, pressed && styles.resultItemPressed]}
                >
                  <Text style={styles.resultFlag}>{c.flag}</Text>
                  <View style={styles.resultTextWrap}>
                    <Text style={styles.resultCity}>{c.name}</Text>
                    <Text style={styles.resultRegion}>{t('location.wholeCountry')}</Text>
                  </View>
                </Pressable>
              ))}
              <Text style={styles.sectionLabel}>{t('location.orSearchCity')}</Text>
            </View>
          ) : searchText.length > 0 && searchText.length < 2 ? (
            <Text style={styles.hint}>{t('location.minChars')}</Text>
          ) : searching ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : results.length === 0 && searchText.length >= 2 ? (
            <Text style={styles.hint}>{t('location.noResults')}</Text>
          ) : (
            <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              keyboardShouldPersistTaps="handled"
              style={styles.resultsList}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  triggerError: {
    borderColor: colors.error,
  },
  triggerFlag: {
    fontSize: 16,
  },
  triggerText: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  triggerPlaceholder: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  clearBtn: {
    padding: 2,
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  // ─── Modal ────────────────────────────────────────────────────────────────────
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  loader: {
    marginTop: spacing.xl,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultItemPressed: {
    backgroundColor: `${colors.accent}15`,
  },
  resultFlag: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  resultTextWrap: {
    flex: 1,
    gap: 2,
  },
  resultCity: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  resultRegion: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
