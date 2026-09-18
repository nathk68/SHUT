import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { EventStatus, EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from '../../config/constants';

interface Props {
  label: string;
  color?: string;
  style?: ViewStyle;
}

export function Badge({ label, color = colors.accentLight, style }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

export function EventStatusBadge({ status, style }: { status: EventStatus; style?: ViewStyle }) {
  const color = EVENT_STATUS_COLORS[status];
  const label = EVENT_STATUS_LABELS[status];

  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }, style]}>
      {status === 'live' && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs + 1,
  },
  text: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
