import {useEffect, useRef} from 'react';
import type {EmitterSubscription} from 'react-native';
import {SpeechService, StorageService, AlarmService, HapticsService} from '@/services';
import {useCaptureStore} from '@/stores';
import {useNotesStore} from '@/stores';
import {classifyNote} from '@/utils';
import {parseTimeFromText} from '@/utils';
import type {Note} from '@/types';
import {generateId} from '@/utils/generateId';

export function useVoiceCapture() {
  const {setStatus, setPartialTranscript, setErrorMessage} = useCaptureStore();
  const addNote = useNotesStore(s => s.addNote);

  const subsRef = useRef<EmitterSubscription[]>([]);

  const cleanup = () => {
    subsRef.current.forEach(s => s.remove());
    subsRef.current = [];
  };

  useEffect(() => {
    return cleanup;
  }, []);

  const startCapture = async () => {
    try {
      setStatus('starting');
      HapticsService.notificationSuccess();

      // Subscribe to events before starting
      subsRef.current.push(
        SpeechService.onPartialResult(({text}) => {
          setPartialTranscript(text);
        }),
        SpeechService.onResult(async ({transcript}) => {
          setStatus('processing');
          await saveNote(transcript, 'voice');
        }),
        SpeechService.onError(({message}) => {
          setStatus('error');
          setErrorMessage(message);
          cleanup();
        }),
      );

      await SpeechService.startListening();
      setStatus('listening');
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e?.message ?? 'Failed to start listening');
    }
  };

  const stopCapture = async () => {
    try {
      await SpeechService.stopListening();
      // Status transitions to 'processing' via onResult listener
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e?.message ?? 'Failed to stop listening');
    }
  };

  const cancelCapture = () => {
    SpeechService.cancelListening();
    cleanup();
    setStatus('idle');
    setPartialTranscript('');
  };

  const saveNote = async (transcript: string, source: 'voice' | 'text') => {
    if (!transcript.trim()) {
      setStatus('idle');
      cleanup();
      return;
    }

    const classification = classifyNote(transcript);
    const reminderAt = classification.type === 'reminder'
      ? parseTimeFromText(transcript)
      : undefined;

    const note: Note = {
      id: generateId(),
      text: transcript.trim(),
      createdAt: Date.now(),
      type: classification.type,
      inputSource: source,
      tags: [],
      confidence: classification.confidence,
      reminderAt,
    };

    // Optimistic update — appears instantly
    addNote(note);

    try {
      await StorageService.saveNote(note);

      if (note.type === 'reminder' && reminderAt) {
        await AlarmService.scheduleReminder(note.id, reminderAt, note.text);
      }

      HapticsService.notificationSave();
      setStatus('saved');

      setTimeout(() => {
        setStatus('idle');
        setPartialTranscript('');
      }, 2000);
    } catch {
      // Note is already in UI — don't remove it, just log
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } finally {
      cleanup();
    }
  };

  return {startCapture, stopCapture, cancelCapture};
}
