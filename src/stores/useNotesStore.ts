import {create} from 'zustand';
import type {Note, NoteType} from '@/types';
import {StorageService} from '@/services';

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  activeFilter: NoteType | 'all';

  fetchNotes: () => Promise<void>;
  addNote: (note: Note) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  setFilter: (filter: NoteType | 'all') => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  isLoading: false,
  activeFilter: 'all',

  fetchNotes: async () => {
    set({isLoading: true});
    try {
      const dbNotes = await StorageService.getNotes();
      set(state => {
        // Merge: keep any in-memory optimistic notes whose id isn't yet in DB
        const dbIds = new Set(dbNotes.map(n => n.id));
        const pending = state.notes.filter(n => !dbIds.has(n.id));
        const merged = [...pending, ...dbNotes].sort(
          (a, b) => b.createdAt - a.createdAt,
        );
        return {notes: merged, isLoading: false};
      });
    } catch (e) {
      console.warn('fetchNotes failed', e);
      set({isLoading: false});
    }
  },

  // Optimistic: note appears instantly, StorageService.saveNote called by the caller
  addNote: (note: Note) => {
    set(state => ({notes: [note, ...state.notes]}));
  },

  removeNote: (id: string) => {
    set(state => ({notes: state.notes.filter(n => n.id !== id)}));
    StorageService.deleteNote(id).catch(() => {});
  },

  updateNote: (id: string, patch: Partial<Note>) => {
    set(state => ({
      notes: state.notes.map(n => (n.id === id ? {...n, ...patch} : n)),
    }));
  },

  setFilter: (filter: NoteType | 'all') => set({activeFilter: filter}),
}));
