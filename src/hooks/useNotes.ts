import {useEffect} from 'react';
import {useNotesStore} from '@/stores';

export function useNotes() {
  const {notes, isLoading, fetchNotes, filteredNotes, activeFilter, setFilter} =
    useNotesStore();

  useEffect(() => {
    fetchNotes();
  }, []);

  return {
    notes: filteredNotes(),
    allNotes: notes,
    isLoading,
    activeFilter,
    setFilter,
    refresh: fetchNotes,
  };
}
