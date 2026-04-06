import {create} from 'zustand';

export type CaptureMode = 'voice' | 'text';
export type CaptureStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'typing'
  | 'processing'
  | 'saved'
  | 'error';

interface CaptureState {
  mode: CaptureMode;
  status: CaptureStatus;
  partialTranscript: string;
  textDraft: string;
  errorMessage: string | null;
  isOverlayOpen: boolean;

  setMode: (mode: CaptureMode) => void;
  setStatus: (status: CaptureStatus) => void;
  setPartialTranscript: (text: string) => void;
  setTextDraft: (text: string) => void;
  setErrorMessage: (msg: string | null) => void;
  openOverlay: (mode?: CaptureMode) => void;
  closeOverlay: () => void;
  reset: () => void;
}

export const useCaptureStore = create<CaptureState>(set => ({
  mode: 'voice',
  status: 'idle',
  partialTranscript: '',
  textDraft: '',
  errorMessage: null,
  isOverlayOpen: false,

  setMode: (mode: CaptureMode) => set({mode, partialTranscript: '', textDraft: ''}),
  setStatus: (status: CaptureStatus) => set({status}),
  setPartialTranscript: (text: string) => set({partialTranscript: text}),
  setTextDraft: (text: string) => set({textDraft: text}),
  setErrorMessage: (msg: string | null) => set({errorMessage: msg}),

  openOverlay: (mode: CaptureMode = 'voice') =>
    set({isOverlayOpen: true, mode, partialTranscript: '', textDraft: '', status: 'idle', errorMessage: null}),

  closeOverlay: () =>
    set({isOverlayOpen: false, status: 'idle', partialTranscript: '', textDraft: ''}),

  reset: () =>
    set({
      status: 'idle',
      partialTranscript: '',
      textDraft: '',
      errorMessage: null,
    }),
}));
