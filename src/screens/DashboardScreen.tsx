import React, {useEffect} from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {StackScreenProps} from '@react-navigation/stack';
import type {TabParamList, RootStackParamList} from '@/navigation/routes';
import {colors, typography, spacing} from '@/theme';
import {ThoughtCard} from '@/components/thoughts/ThoughtCard';
import {FilterChip} from '@/components/common/FilterChip';
import {OasisRing} from '@/components/oasis/OasisRing';
import {useNotes, usePermissions} from '@/hooks';
import {useNotesStore, useCaptureStore} from '@/stores';
import type {NoteType} from '@/types';
import {AlarmService} from '@/services';

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

export default function DashboardScreen({navigation}: Props) {
  const {notes, isLoading, activeFilter, setFilter, refresh} = useNotes();
  const openOverlay = useCaptureStore(s => s.openOverlay);
  const {requestAll, allGranted} = usePermissions();

  useEffect(() => {
    if (!allGranted) requestAll();
    // Schedule weekly recap on first load
    AlarmService.scheduleWeeklyRecap().catch(() => {});
  }, []);

  const handleOpenCapture = (mode: 'voice' | 'text' = 'voice') => {
    openOverlay(mode);
    navigation.navigate('CaptureOverlay', {defaultMode: mode});
  };

  const handleNotePress = (noteId: string) => {
    navigation.navigate('ThoughtDetail', {noteId});
  };

  const [featuredNote, ...restNotes] = notes;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Oasis</Text>
          <TouchableOpacity onPress={() => handleOpenCapture('text')} style={styles.textBtn}>
            <Text style={styles.textBtnLabel}>⌨️</Text>
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.subGreeting}>
          {notes.length === 0
            ? 'Your mind is clear. Start capturing thoughts.'
            : `${notes.length} thought${notes.length === 1 ? '' : 's'} captured`}
        </Text>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
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

        {/* Bento grid */}
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Tap the ring to capture your first thought
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {/* Featured large card */}
            {featuredNote && (
              <ThoughtCard
                note={featuredNote}
                large
                onPress={() => handleNotePress(featuredNote.id)}
              />
            )}

            {/* Remaining cards in 2-col grid */}
            {restNotes.length > 0 && (
              <View style={styles.twoCol}>
                {restNotes.map((note, i) => (
                  <View key={note.id} style={[styles.colCard, i % 2 === 1 && styles.colCardOffset]}>
                    <ThoughtCard
                      note={note}
                      onPress={() => handleNotePress(note.id)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Bottom spacer for FAB */}
        <View style={{height: 100}} />
      </ScrollView>

      {/* Oasis Ring FAB */}
      <View style={styles.fab}>
        <OasisRing
          size={64}
          onPress={() => handleOpenCapture('voice')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.base,
  },
  appName: {
    ...typography.headlineSm,
    color: colors.tertiary,
  },
  textBtn: {
    padding: spacing.sm,
  },
  textBtnLabel: {
    fontSize: 22,
  },
  greeting: {
    ...typography.headlineMd,
    color: colors.onSurface,
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.xs,
  },
  subGreeting: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
    opacity: 0.7,
  },
  filterRow: {
    marginBottom: spacing.xl,
  },
  filterContent: {
    paddingHorizontal: spacing['2xl'],
    gap: spacing.sm,
    flexDirection: 'row',
  },
  grid: {
    paddingHorizontal: spacing.base,
    gap: spacing.base,
  },
  twoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  colCard: {
    flex: 1,
    minWidth: '45%',
  },
  colCardOffset: {
    marginTop: spacing['2xl'], // asymmetric bento offset
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing['2xl'],
  },
  emptyText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    bottom: spacing['3xl'],
    alignSelf: 'center',
  },
});
