import {NativeModules, DeviceEventEmitter, EmitterSubscription} from 'react-native';

const {AudioModule} = NativeModules;

export interface AudioProgressEvent {
  position: number; // ms
  duration: number; // ms
}

export interface PlayAudioResult {
  duration: number; // ms
}

export const AudioService = {
  play(path: string): Promise<PlayAudioResult> {
    return AudioModule.playAudio(path);
  },

  pause(): Promise<void> {
    return AudioModule.pauseAudio();
  },

  resume(): Promise<void> {
    return AudioModule.resumeAudio();
  },

  stop(): Promise<void> {
    return AudioModule.stopAudio();
  },

  seekTo(positionMs: number): Promise<void> {
    return AudioModule.seekTo(positionMs);
  },

  getInfo(path: string): Promise<{duration: number}> {
    return AudioModule.getAudioInfo(path);
  },

  onProgress(listener: (e: AudioProgressEvent) => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('onAudioProgress', listener);
  },

  onEnd(listener: () => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('onAudioEnd', listener);
  },
};
