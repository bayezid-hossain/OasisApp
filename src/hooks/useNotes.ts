import {useEffect} from 'react';
import {useNotesStore} from '@/stores';

export function useNotes() {
  const notes = useNotesStore(s => s.notes);
  const isLoading = useNotesStore(s => s.isLoading);
  const activeFilter = useNotesStore(s => s.activeFilter);
  const fetchNotes = useNotesStore(s => s.fetchNotes);
  const setFilter = useNotesStore(s => s.setFilter);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filtered = activeFilter === 'all' 
    ? notes 
    : notes.filter(n => n.type === activeFilter);

  return {
    notes: filtered,
    allNotes: notes,
    isLoading,
    activeFilter,
    setFilter,
    refresh: fetchNotes,
  };
}
