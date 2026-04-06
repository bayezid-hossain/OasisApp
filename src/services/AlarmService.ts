import {NativeModules} from 'react-native';
import type {ScheduleReminderResult} from '@/types';

const {AlarmModule} = NativeModules;

export const AlarmService = {
  scheduleReminder(
    noteId: string,
    epochMillis: number,
    label: string,
  ): Promise<ScheduleReminderResult> {
    return AlarmModule.scheduleReminder(noteId, epochMillis, label);
  },

  cancelReminder(requestCode: number): Promise<void> {
    return AlarmModule.cancelReminder(requestCode);
  },

  scheduleWeeklyRecap(): Promise<void> {
    return AlarmModule.scheduleWeeklyRecap();
  },
};
