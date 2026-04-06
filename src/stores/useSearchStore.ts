import {create} from 'zustand';
import type {Note} from '@/types';
import {StorageService} from '@/services';

interface SearchState {
  query: string;
  results: Note[];
  isSearching: boolean;

  setQuery: (q: string) => void;
  clearSearch: () => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useSearchStore = create<SearchState>(set => ({
  query: '',
  results: [],
  isSearching: false,

  setQuery: (q: string) => {
    set({query: q});
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!q.trim()) {
      set({results: [], isSearching: false});
      return;
    }
    set({isSearching: true});
    debounceTimer = setTimeout(async () => {
      try {
        const results = await StorageService.searchNotes(q.trim());
        set({results, isSearching: false});
      } catch {
        set({isSearching: false});
      }
    }, 300);
  },

  clearSearch: () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    set({query: '', results: [], isSearching: false});
  },
}));
