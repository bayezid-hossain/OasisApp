import {NativeModules} from 'react-native';
import type {Note, SaveNoteResult} from '@/types';

const {StorageModule} = NativeModules;

function rawToNote(raw: any): Note {
  return {
    id: raw.id,
    text: raw.text,
    createdAt: raw.createdAt,
    type: raw.type,
    inputSource: raw.inputSource ?? 'text',
    tags: raw.tags ? JSON.parse(raw.tags) : [],
    confidence: raw.confidence ?? 0.6,
    reminderAt: raw.reminderAt ?? undefined,
    reminderFired: raw.reminderFired ?? false,
    isCompleted: raw.isCompleted ?? false,
  };
}

export const StorageService = {
  async saveNote(note: Note): Promise<SaveNoteResult> {
    const payload = {
      ...note,
      tags: JSON.stringify(note.tags),
    };
    return StorageModule.saveNote(JSON.stringify(payload));
  },

  async getNotes(limit = 200): Promise<Note[]> {
    const raw = await StorageModule.getNotes(limit);
    return (raw as any[]).map(rawToNote);
  },

  async searchNotes(query: string): Promise<Note[]> {
    const raw = await StorageModule.searchNotes(query);
    return (raw as any[]).map(rawToNote);
  },

  async markNoteComplete(id: string): Promise<void> {
    return StorageModule.markNoteComplete(id);
  },

  async deleteNote(id: string): Promise<void> {
    return StorageModule.deleteNote(id);
  },

  async getLatestNote(): Promise<Note | null> {
    const raw = await StorageModule.getLatestNote();
    return raw ? rawToNote(raw) : null;
  },
};
