import {NoteType, InputSource} from './NoteType';

export interface Note {
  id: string;
  text: string;
  createdAt: number; // epoch ms
  type: NoteType;
  inputSource: InputSource;
  tags: string[];
  confidence: number; // 0.0 – 1.0
  reminderAt?: number; // epoch ms, undefined if no reminder
  reminderFired?: boolean;
  isCompleted?: boolean;
}

export interface Reminder {
  reminderId: string;
  noteId: string;
  scheduledAt: number;
  label: string;
  alarmRequestCode: number;
  isFired: boolean;
}
