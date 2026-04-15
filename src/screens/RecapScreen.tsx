import React, {useEffect, useMemo} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, typography, spacing, radius} from '@/theme';
import {useNotesStore} from '@/stores';
import type {Note} from '@/types';
import type {NoteType} from '@/types';
import {ThoughtTypeBadge} from '@/components/thoughts/ThoughtTypeBadge';

const TYPE_ORDER: NoteType[] = ['reminder', 'idea', 'note', 'contact'];

function groupByType(notes: Note[]): Record<string, Note[]> {
  return notes.reduce<Record<string, Note[]>>((acc, n) => {
    acc[n.type] = acc[n.type] ? [...acc[n.type], n] : [n];
    return acc;
  }, {});
}

export default function RecapScreen() {
  // Subscribe to the store so new notes appear instantly.
  const allNotes = useNotesStore(s => s.notes);
  const isLoading = useNotesStore(s => s.isLoading);
  const fetchNotes = useNotesStore(s => s.fetchNotes);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const weekNotes = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return allNotes.filter(n => n.createdAt >= since);
  }, [allNotes]);

  const loading = isLoading && weekNotes.length === 0;

  const groups = groupByType(weekNotes);
  const voiceCount = weekNotes.filter(n => n.inputSource === 'voice').length;
  const textCount = weekNotes.filter(n => n.inputSource === 'text').length;
  const completedCount = weekNotes.filter(n => n.isCompleted).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.heading}>Weekly Recap</Text>
        <Text style={styles.subHeading}>
          {new Date().toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {loading ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : weekNotes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No thoughts captured this week yet.{'\n'}Start capturing!
            </Text>
          </View>
        ) : (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard value={weekNotes.length} label="Thoughts" />
              <StatCard value={voiceCount} label="Voice" />
              <StatCard value={textCount} label="Typed" />
              <StatCard value={completedCount} label="Done" />
            </View>

            {/* By type */}
            {TYPE_ORDER.filter(t => groups[t]?.length > 0).map(type => (
              <View key={type} style={styles.typeSection}>
                <View style={styles.typeSectionHeader}>
                  <ThoughtTypeBadge type={type} />
                  <Text style={styles.typeCount}>
                    {groups[type].length}
                  </Text>
                </View>
                {groups[type].slice(0, 3).map(note => (
                  <View key={note.id} style={styles.noteRow}>
                    <Text style={styles.noteDot}>·</Text>
                    <Text style={styles.noteText} numberOfLines={2}>
                      {note.text?.trim() || (note.audioPath ? '🎤 Voice note' : '')}
                    </Text>
                  </View>
                ))}
                {groups[type].length > 3 && (
                  <Text style={styles.moreLabel}>
                    +{groups[type].length - 3} more
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({value, label}: {value: number; label: string}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing['2xl'],
    gap: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  heading: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  subHeading: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
    marginTop: -spacing.md,
  },
  loading: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius['2xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 26,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.xl,
    padding: spacing.base,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...typography.headlineSm,
    color: colors.tertiary,
  },
  statLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  typeSection: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    gap: spacing.sm,
  },
  typeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  typeCount: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  noteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  noteDot: {
    color: colors.outlineVariant,
    fontSize: 16,
    lineHeight: 20,
  },
  noteText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
  moreLabel: {
    ...typography.labelSm,
    color: colors.tertiary,
    opacity: 0.7,
  },
});
