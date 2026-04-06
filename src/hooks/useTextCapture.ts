import {StorageService, AlarmService, HapticsService} from '@/services';
import {useCaptureStore, useNotesStore} from '@/stores';
import {classifyNote, parseTimeFromText, generateId} from '@/utils';
import type {Note} from '@/types';

export function useTextCapture() {
  const {setStatus, setErrorMessage, textDraft, closeOverlay} = useCaptureStore();
  const addNote = useNotesStore(s => s.addNote);

  const submitText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setStatus('processing');

    const classification = classifyNote(trimmed);
    const reminderAt =
      classification.type === 'reminder'
        ? parseTimeFromText(trimmed)
        : undefined;

    const note: Note = {
      id: generateId(),
      text: trimmed,
      createdAt: Date.now(),
      type: classification.type,
      inputSource: 'text',
      tags: [],
      confidence: classification.confidence,
      reminderAt,
    };

    // Optimistic update
    addNote(note);

    try {
      await StorageService.saveNote(note);

      if (note.type === 'reminder' && reminderAt) {
        await AlarmService.scheduleReminder(note.id, reminderAt, note.text);
      }

      HapticsService.notificationSave();
      setStatus('saved');

      setTimeout(() => {
        closeOverlay();
      }, 1000);
    } catch {
      setStatus('saved');
      setTimeout(() => closeOverlay(), 1000);
    }
  };

  return {submitText};
}
