import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, typography, spacing, radius} from '@/theme';
import type {NoteType} from '@/types';

const CONFIG: Record<NoteType, {label: string; color: string; bg: string}> = {
  reminder: {label: '⏰ Reminder', color: '#FFB347', bg: '#3D2800'},
  idea: {label: '💡 Idea', color: colors.tertiary, bg: colors.tertiaryContainer},
  contact: {label: '📞 Contact', color: '#87CEEB', bg: '#002540'},
  note: {label: '📝 Note', color: colors.primary, bg: colors.primaryContainer},
};

interface ThoughtTypeBadgeProps {
  type: NoteType;
}

export function ThoughtTypeBadge({type}: ThoughtTypeBadgeProps) {
  const cfg = CONFIG[type];
  return (
    <View style={[styles.badge, {backgroundColor: cfg.bg}]}>
      <Text style={[styles.label, {color: cfg.color}]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  label: {
    ...typography.labelSm,
  },
});
