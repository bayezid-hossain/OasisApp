import {NativeModules, DeviceEventEmitter, EmitterSubscription} from 'react-native';
import type {
  StartListeningResult,
  PartialResultEvent,
  AmplitudeUpdateEvent,
  SpeechErrorEvent,
  SpeechResultEvent,
} from '@/types';

const {SpeechModule} = NativeModules;

export const SpeechService = {
  /**
   * @param language BCP-47 language code e.g. "en-US", "es-ES", "bn-BD", "hi-IN".
   *                 Pass undefined to use the device's default language.
   */
  startListening(language?: string): Promise<StartListeningResult> {
    return SpeechModule.startListening(language ?? null);
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
