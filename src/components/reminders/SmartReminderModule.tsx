import React, {useState} from 'react';
import {StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {colors, typography, spacing, radius} from '@/theme';
import {formatReminderTime} from '@/utils';
import {AlarmService} from '@/services';
import {useNotesStore} from '@/stores';
import type {Note} from '@/types';

interface SmartReminderModuleProps {
  note: Note;
}

export function SmartReminderModule({note}: SmartReminderModuleProps) {
  const [enabled, setEnabled] = useState(
    note.type === 'reminder' && !!note.reminderAt && !note.reminderFired,
  );
  const updateNote = useNotesStore(s => s.updateNote);

  const handleToggle = async (val: boolean) => {
    setEnabled(val);
    if (!val && note.reminderAt) {
      const requestCode = note.id.hashCode ? note.id.hashCode() : 0;
      await AlarmService.cancelReminder(Math.abs(note.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)));
      updateNote(note.id, {reminderFired: true});
    }
  };

  if (!note.reminderAt) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>⏰</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Smart Reminder</Text>
          <Text style={styles.time}>{formatReminderTime(note.reminderAt)}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{false: colors.outlineVariant, true: colors.tertiaryContainer}}
          thumbColor={enabled ? colors.tertiary : colors.onSurfaceVariant}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.titleSm,
    color: colors.onSurface,
  },
  time: {
    ...typography.bodyMd,
    color: colors.tertiary,
    marginTop: 2,
  },
});
