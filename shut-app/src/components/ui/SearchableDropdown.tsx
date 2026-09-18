import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

interface Option {
  id: string;
  label: string;
  prefix?: string; // flag emoji or icon prefix
}

interface Props {
  options: Option[];
  label: string;       // title label shown above the trigger
  placeholder?: string; // shown in option list search
  value?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name']; // contextual icon inside the box
}

export function SearchableDropdown({ options, label, placeholder, value, onSelect, disabled, leftIcon }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>(value);

  // Sync when parent drives selection (e.g. map tap → update dropdown)
  useEffect(() => {
    setSelectedId(value);
  }, [value]);

  const selectedOption = options.find((o) => o.id === selectedId);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  function handleTriggerPress() {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearch('');
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    onSelect(id);
    setIsOpen(false);
    setSearch('');
  }

  return (
    <View style={styles.container}>
      {/* Label title above the box */}
      <Text style={styles.label} onPress={handleTriggerPress}>
        {label}
      </Text>

      <Pressable
        onPress={handleTriggerPress}
        style={[styles.trigger, disabled && styles.triggerDisabled, isOpen && styles.triggerOpen]}
      >
        {/* Left: flag circle (when value with prefix) or contextual icon */}
        {selectedOption?.prefix ? (
          <View style={styles.flagCircle}>
            <Text style={styles.flagText}>{selectedOption.prefix}</Text>
          </View>
        ) : leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={colors.textMuted} style={styles.leftIcon} />
        ) : null}

        {/* Selected value */}
        {selectedOption && (
          <Text style={styles.valueText}>{selectedOption.label}</Text>
        )}

        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </Pressable>

      {isOpen && (
        <View style={styles.dropdown}>
          <TextInput
            placeholder={placeholder ?? 'Rechercher...'}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>Aucun résultat</Text>
          ) : (
            filtered.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => handleSelect(option.id)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                {option.prefix ? (
                  <View style={styles.flagCircle}>
                    <Text style={styles.flagText}>{option.prefix}</Text>
                  </View>
                ) : null}
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  trigger: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  triggerOpen: {
    borderColor: colors.accent,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  triggerDisabled: {
    opacity: 0.35,
  },
  leftIcon: {
    marginRight: 2,
  },
  flagCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 16,
    lineHeight: 18,
  },
  valueText: {
    color: colors.textPrimary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  dropdown: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.accent,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  searchInput: {
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  optionPressed: {
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
});
