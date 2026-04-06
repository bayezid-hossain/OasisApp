import {NativeModules} from 'react-native';

const {HapticsModule} = NativeModules;

export const HapticsService = {
  /** Double pulse — recording start */
  notificationSuccess(): void {
    HapticsModule?.notificationSuccess?.();
  },

  /** Single firm tap — thought saved */
  notificationSave(): void {
    HapticsModule?.notificationSave?.();
  },

  /** Light tap — UI interaction */
  impactLight(): void {
    HapticsModule?.impactLight?.();
  },
};
