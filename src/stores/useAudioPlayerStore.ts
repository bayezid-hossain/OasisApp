import {create} from 'zustand';

/**
 * Shared audio playback state. Ensures only one AudioPlayer component
 * reflects the "playing" state at a time, even though the native
 * AudioModule is a global singleton and broadcasts events to every
 * subscribed component.
 */
interface AudioPlayerState {
  currentPath: string | null;
  setCurrent: (path: string | null) => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>(set => ({
  currentPath: null,
  setCurrent: path => set({currentPath: path}),
}));
