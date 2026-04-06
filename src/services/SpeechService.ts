import {NativeModules, DeviceEventEmitter, EmitterSubscription} from 'react-native';
import type {
  StartListeningResult,
  PartialResultEvent,
  AmplitudeUpdateEvent,
  SpeechErrorEvent,
} from '@/types';

const {SpeechModule} = NativeModules;

export interface SpeechResultEvent {
  transcript: string;
}

export const SpeechService = {
  startListening(): Promise<StartListeningResult> {
    return SpeechModule.startListening();
  },

  stopListening(): Promise<void> {
    return SpeechModule.stopListening();
  },

  cancelListening(): void {
    SpeechModule.cancelListening();
  },

  onPartialResult(
    listener: (event: PartialResultEvent) => void,
  ): EmitterSubscription {
    return DeviceEventEmitter.addListener('onPartialResult', listener);
  },

  onAmplitudeUpdate(
    listener: (event: AmplitudeUpdateEvent) => void,
  ): EmitterSubscription {
    return DeviceEventEmitter.addListener('onAmplitudeUpdate', listener);
  },

  onResult(
    listener: (event: SpeechResultEvent) => void,
  ): EmitterSubscription {
    return DeviceEventEmitter.addListener('onSpeechResult', listener);
  },

  onError(listener: (event: SpeechErrorEvent) => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('onSpeechError', listener);
  },
};
