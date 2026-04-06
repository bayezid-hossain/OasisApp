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
  filteredNotes: () => Note[];
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: false,
  activeFilter: 'all',

  fetchNotes: async () => {
    set({isLoading: true});
    try {
      const notes = await StorageService.getNotes();
      set({notes, isLoading: false});
    } catch {
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

  filteredNotes: () => {
    const {notes, activeFilter} = get();
    if (activeFilter === 'all') return notes;
    return notes.filter(n => n.type === activeFilter);
  },
}));
