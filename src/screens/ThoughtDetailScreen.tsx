import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {StackScreenProps} from '@react-navigation/stack';
import type {RootStackParamList} from '@/navigation/routes';
import {colors, typography, spacing, radius} from '@/theme';
import {ThoughtTypeBadge} from '@/components/thoughts/ThoughtTypeBadge';
import {SmartReminderModule} from '@/components/reminders/SmartReminderModule';
import {AudioPlayer} from '@/components/audio/AudioPlayer';
import {useNotesStore} from '@/stores';
import {formatRelativeTime, formatTimeOfDay} from '@/utils';

type Props = StackScreenProps<RootStackParamList, 'ThoughtDetail'>;

export default function ThoughtDetailScreen({navigation, route}: Props) {
  const {noteId} = route.params;
  const note = useNotesStore(s => s.notes.find(n => n.id === noteId));

  if (!note) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Thought not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <ThoughtTypeBadge type={note.type} />
        <View style={styles.headerRight}>
          <Text style={styles.metaTime}>
            {formatTimeOfDay(note.createdAt)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Main text */}
        <Text style={styles.noteText}>{note.text}</Text>

        {/* Metadata */}
        <Text style={styles.metaLabel}>
          {note.inputSource === 'voice' ? '🎤 Voice' : '⌨️ Typed'} ·{' '}
          {formatRelativeTime(note.createdAt)}
        </Text>

        {/* Audio playback — shown for voice notes that have a recording */}
        {note.audioPath && <AudioPlayer audioPath={note.audioPath} />}

        {/* Reminder module */}
        {note.type === 'reminder' && <SmartReminderModule note={note} />}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagsRow}>
              {note.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagLabel}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mark complete */}
        {!note.isCompleted && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => {
              useNotesStore.getState().updateNote(note.id, {isCompleted: true});
              navigation.goBack();
            }}>
            <Text style={styles.completeBtnLabel}>Mark as done</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 22,
    color: colors.onSurface,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaTime: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing['2xl'],
    gap: spacing.xl,
  },
  noteText: {
    ...typography.headlineSm,
    color: colors.onSurface,
    lineHeight: 40,
  },
  metaLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
  },
  tagsSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  tagLabel: {
    ...typography.labelMd,
    color: colors.tertiary,
  },
  completeBtn: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  completeBtnLabel: {
    ...typography.titleSm,
    color: colors.onPrimaryContainer,
  },
  notFound: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 80,
  },
});
