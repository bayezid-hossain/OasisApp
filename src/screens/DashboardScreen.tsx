import React, {useMemo, useCallback} from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {StackScreenProps} from '@react-navigation/stack';
import type {TabParamList, RootStackParamList} from '@/navigation/routes';
import {colors, typography, spacing, radius} from '@/theme';
import {ThoughtCard} from '@/components/thoughts/ThoughtCard';
import {FilterChip} from '@/components/common/FilterChip';
import {OasisRing} from '@/components/oasis/OasisRing';
import {useNotes, usePermissions} from '@/hooks';
import {useNotesStore, useCaptureStore} from '@/stores';
import type {Note, NoteType} from '@/types';
import {AlarmService} from '@/services';

// ── Date grouping ────────────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupNotesByDate(notes: Note[]): {label: string; notes: Note[]}[] {
  const today = startOfDay(Date.now());
  const yesterday = today - DAY_MS;
  const weekAgo = today - 6 * DAY_MS;

  const buckets = {
    today: [] as Note[],
    yesterday: [] as Note[],
    week: [] as Note[],
    earlier: [] as Note[],
  };

  for (const n of notes) {
    const d = startOfDay(n.createdAt);
    if (d >= today) buckets.today.push(n);
    else if (d >= yesterday) buckets.yesterday.push(n);
    else if (d >= weekAgo) buckets.week.push(n);
    else buckets.earlier.push(n);
  }

  return [
    {label: 'Today', notes: buckets.today},
    {label: 'Yesterday', notes: buckets.yesterday},
    {label: 'This week', notes: buckets.week},
    {label: 'Earlier', notes: buckets.earlier},
  ].filter(g => g.notes.length > 0);
}

// ── Types ────────────────────────────────────────────────────────────────────
type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Dashboard'>,
  StackScreenProps<RootStackParamList>
>;

const FILTERS: {label: string; value: NoteType | 'all'}[] = [
  {label: 'All', value: 'all'},
  {label: 'Notes', value: 'note'},
  {label: 'Ideas', value: 'idea'},
  {label: 'Reminders', value: 'reminder'},
  {label: 'Contacts', value: 'contact'},
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function DashboardScreen({navigation}: Props) {
  const {notes, isLoading, activeFilter, setFilter, refresh} = useNotes();
  const fetchNotes = useNotesStore(s => s.fetchNotes);
  const openOverlay = useCaptureStore(s => s.openOverlay);
  const {requestAll, allGranted} = usePermissions();
  const insets = useSafeAreaInsets();

  // Refresh every time this screen gets focus (covers notification → home)
  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes]),
  );

  // First mount: permissions + weekly recap
  React.useEffect(() => {
    if (!allGranted) requestAll();
    AlarmService.scheduleWeeklyRecap().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCapture = (mode: 'voice' | 'text') => {
    openOverlay(mode);
    navigation.navigate('CaptureOverlay', {defaultMode: mode});
  };

  const groups = useMemo(() => groupNotesByDate(notes), [notes]);

  // Bottom bar height so content is never hidden under it
  const BAR_H = 72;
  const barTotal = BAR_H + insets.bottom;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Oasis</Text>
          <Text style={styles.noteCount}>
            {notes.length === 0
              ? 'No thoughts yet'
              : `${notes.length} thought${notes.length === 1 ? '' : 's'}`}
          </Text>
        </View>
        <Text style={styles.greetingInline}>{greeting()}</Text>
      </View>

      {/* ── Filter chips ─────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={activeFilter === f.value}
            onPress={() => setFilter(f.value)}
          />
        ))}
      </ScrollView>

      {/* ── Notes list ───────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: barTotal + spacing.xl},
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.tertiary}
            colors={[colors.tertiary]}
          />
        }>
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Your mind is clear.</Text>
            <Text style={styles.emptyBody}>
              Hold the ring to capture a voice note,{'\n'}or tap Text to write.
            </Text>
          </View>
        ) : (
          <View style={styles.sections}>
            {groups.map(group => (
              <View key={group.label} style={styles.section}>
                <Text style={styles.sectionLabel}>{group.label}</Text>
                {group.notes.map(note => (
                  <ThoughtCard
                    key={note.id}
                    note={note}
                    onPress={() =>
                      navigation.navigate('ThoughtDetail', {noteId: note.id})
                    }
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Bottom capture bar ───────────────────────────────────── */}
      <View style={[styles.captureBar, {height: barTotal, paddingBottom: insets.bottom}]}>
        {/* Text button */}
        <TouchableOpacity
          style={styles.textBtn}
          onPress={() => handleOpenCapture('text')}
          activeOpacity={0.75}>
          <Text style={styles.textBtnIcon}>✎</Text>
          <Text style={styles.textBtnLabel}>Text</Text>
        </TouchableOpacity>

        {/* Oasis Ring — voice */}
        <OasisRing size={56} onPress={() => handleOpenCapture('voice')} />
      </View>

    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  appName: {
    ...typography.headlineSm,
    color: colors.tertiary,
    letterSpacing: 0.5,
  },
  noteCount: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
    marginTop: 2,
  },
  greetingInline: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing['2xl'],
    gap: spacing.sm,
    flexDirection: 'row',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.sm,
  },
  sections: {
    gap: spacing['2xl'],
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.5,
    marginBottom: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['5xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    opacity: 0.8,
  },
  emptyBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 22,
  },
  // Bottom bar: solid surface so cards never peek through
  captureBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['3xl'],
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: `${colors.outlineVariant}40`,
  },
  textBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  textBtnIcon: {
    fontSize: 22,
    color: colors.onSurfaceVariant,
  },
  textBtnLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    opacity: 0.8,
  },
});
