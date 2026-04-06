import {useEffect, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'never_ask_again' | 'undetermined';

interface PermissionsState {
  microphone: PermissionStatus;
  notifications: PermissionStatus;
  allGranted: boolean;
  requestAll: () => Promise<void>;
}

export function usePermissions(): PermissionsState {
  const [microphone, setMicrophone] = useState<PermissionStatus>('undetermined');
  const [notifications, setNotifications] = useState<PermissionStatus>('undetermined');

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') return;

    const mic = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    setMicrophone(mic ? 'granted' : 'undetermined');

    if (Platform.Version >= 33) {
      const notif = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any,
      );
      setNotifications(notif ? 'granted' : 'undetermined');
    } else {
      setNotifications('granted'); // auto-granted below API 33
    }
  };

  const requestAll = async () => {
    if (Platform.OS !== 'android') return;

    const permissions: string[] = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (Platform.Version >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any);
    }

    const results = await PermissionsAndroid.requestMultiple(permissions as any[]);

    const micResult = results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    setMicrophone(
      micResult === 'granted' ? 'granted' :
      micResult === 'never_ask_again' ? 'never_ask_again' : 'denied'
    );

    if (Platform.Version >= 33) {
      const notifResult = results[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any];
      setNotifications(
        notifResult === 'granted' ? 'granted' :
        notifResult === 'never_ask_again' ? 'never_ask_again' : 'denied'
      );
    } else {
      setNotifications('granted');
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    microphone,
    notifications,
    allGranted: microphone === 'granted',
    requestAll,
  };
}
