import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, typography, spacing, radius} from '@/theme';
import {ThoughtTypeBadge} from './ThoughtTypeBadge';
import {formatRelativeTime} from '@/utils';
import type {Note} from '@/types';

interface ThoughtCardProps {
  note: Note;
  onPress?: () => void;
  large?: boolean;
}

export function ThoughtCard({note, onPress, large = false}: ThoughtCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, large && styles.cardLarge]}
      onPress={onPress}
      activeOpacity={0.75}>
      <ThoughtTypeBadge type={note.type} />
      <Text
        style={[styles.text, large ? styles.textLarge : styles.textRegular]}
        numberOfLines={large ? 6 : 3}>
        {note.text}
      </Text>
      <Text style={styles.time}>{formatRelativeTime(note.createdAt)}</Text>

      {note.isCompleted && (
        <View style={styles.completedOverlay}>
          <Text style={styles.completedIcon}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius['3xl'],
    padding: spacing.xl,
    gap: spacing.sm,
    // Ghost border for accessibility
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}26`, // 15% opacity
  },
  cardLarge: {
    padding: spacing['2xl'],
  },
  text: {
    color: colors.onSurface,
    flexShrink: 1,
  },
  textRegular: {
    ...typography.bodyMd,
  },
  textLarge: {
    ...typography.titleMd,
    lineHeight: 26,
  },
  time: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
  },
  completedOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
