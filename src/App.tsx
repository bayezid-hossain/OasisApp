import React, {useEffect} from 'react';
import {DeviceEventEmitter, StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from '@/navigation';
import {colors} from '@/theme';

// Deep-link handler — listens for events from MainActivity
// (QS Tile, widget, reminder notification taps)
let navigationRef: any = null;

export function setNavigationRef(ref: any) {
  navigationRef = ref;
}

function useDeepLinkHandler() {
  useEffect(() => {
    const openCaptureSub = DeviceEventEmitter.addListener(
      'onOpenCapture',
      ({mode}: {mode: string}) => {
        navigationRef?.navigate('CaptureOverlay', {defaultMode: mode});
      },
    );

    const openNoteSub = DeviceEventEmitter.addListener(
      'onOpenNote',
      ({noteId}: {noteId: string}) => {
        navigationRef?.navigate('ThoughtDetail', {noteId});
      },
    );

    return () => {
      openCaptureSub.remove();
      openNoteSub.remove();
    };
  }, []);
}

export default function App() {
  useDeepLinkHandler();

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.surface}
          translucent={false}
        />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
