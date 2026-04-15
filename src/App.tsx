import React, {useEffect} from 'react';
import {DeviceEventEmitter, StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from '@/navigation';
import {colors} from '@/theme';
import {useNotesStore} from '@/stores';

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

    // Global voice-result listener: any voice note saved by the native
    // service (from the notification, widget, QS tile, or in-app) refreshes
    // the notes store so the dashboard updates immediately — even when the
    // CaptureOverlay wasn't the one that triggered it.
    const voiceResultSub = DeviceEventEmitter.addListener(
      'onSpeechResult',
      () => {
        useNotesStore.getState().fetchNotes();
      },
    );

    return () => {
      openCaptureSub.remove();
      openNoteSub.remove();
      voiceResultSub.remove();
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
