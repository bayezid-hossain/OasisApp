import { HapticsService, SpeechService } from '@/services';
import { useCaptureStore, useNotesStore } from '@/stores';
import type { Note } from '@/types';
import { generateId } from '@/utils/generateId';
import { useEffect, useRef } from 'react';
import type { EmitterSubscription } from 'react-native';

/**
 * Audio-only voice capture. Records raw audio; transcription is deferred
 * to a future background step (Grok API). The native service persists the
 * note to Room directly — this hook adds it optimistically to the store on
 * result so the dashboard updates instantly.
 */
export function useVoiceCapture() {
  const { setStatus, setErrorMessage, setPartialTranscript } = useCaptureStore();
  const addNote = useNotesStore(s => s.addNote);

  const subsRef = useRef<EmitterSubscription[]>([]);
  const resultReceivedRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchNotes = useNotesStore(s => s.fetchNotes);

  const cleanup = () => {
    subsRef.current.forEach(s => s.remove());
    subsRef.current = [];
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  const startCapture = async () => {
    try {
      setStatus('starting');
      setPartialTranscript('');
      resultReceivedRef.current = false;
      HapticsService.notificationSuccess();

      subsRef.current.push(
        SpeechService.onResult(({ noteId, audioPath }) => {
          if (resultReceivedRef.current) return;
          resultReceivedRef.current = true;

          const note: Note = {
            id: noteId ?? generateId(),
            text: '', // transcription happens later (background Grok step)
            createdAt: Date.now(),
            type: 'note',
            inputSource: 'voice',
            tags: [],
            confidence: 0,
            audioPath: audioPath || undefined,
          };

          // Optimistic: appears instantly in dashboard (service already wrote DB).
          addNote(note);
          // Also reconcile with DB so any store subscribers pick up the persisted row.
          fetchNotes();
          HapticsService.notificationSave();
          setStatus('saved');

          setTimeout(() => {
            setStatus('idle');
            setPartialTranscript('');
          }, 1200);
          cleanup();
        }),
        SpeechService.onError(({ message }) => {
          setStatus('error');
          setErrorMessage(message);
          cleanup();
        }),
      );

      await SpeechService.startListening();
      setStatus('listening');
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e?.message ?? 'Failed to start recording');
    }
  };

  const stopCapture = async () => {
    const { status } = useCaptureStore.getState();
    try {
      if (status === 'starting') {
        cancelCapture();
        return;
      }
      // Don't set 'processing' — we want to go listening → saved directly
      // when the native event arrives, so the overlay can close promptly.
      await SpeechService.stopListening();

      // Safety net: if no onResult event within 1500ms (bridge hiccup),
      // assume the service already saved natively and force-refresh.
      safetyTimerRef.current = setTimeout(() => {
        if (resultReceivedRef.current) return;
        resultReceivedRef.current = true;
        fetchNotes();
        HapticsService.notificationSave();
        setStatus('saved');
        setTimeout(() => {
          setStatus('idle');
          setPartialTranscript('');
        }, 1000);
        cleanup();
      }, 1500);
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e?.message ?? 'Failed to stop recording');
    }
  };

  const cancelCapture = () => {
    SpeechService.cancelListening();
    cleanup();
    setStatus('idle');
    setPartialTranscript('');
  };

  return { startCapture, stopCapture, cancelCapture };
}
