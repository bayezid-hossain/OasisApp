import React, {useEffect} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import type {StackScreenProps} from '@react-navigation/stack';
import type {RootStackParamList} from '@/navigation/routes';
import {colors, spacing, typography, radius} from '@/theme';
import {useCaptureStore} from '@/stores';
import type {CaptureMode} from '@/stores';
import {VoiceCaptureMode} from '@/components/oasis/VoiceCaptureMode';
import {TextCaptureMode} from '@/components/oasis/TextCaptureMode';
import {SpeechService} from '@/services';

type Props = StackScreenProps<RootStackParamList, 'CaptureOverlay'>;

export default function CaptureOverlay({navigation, route}: Props) {
  const {mode, setMode, status, closeOverlay} = useCaptureStore();

  useEffect(() => {
    const defaultMode = route.params?.defaultMode ?? 'voice';
    setMode(defaultMode);
    return () => {
      SpeechService.cancelListening();
      closeOverlay();
    };
  }, []);

  const handleClose = () => {
    SpeechService.cancelListening();
    closeOverlay();
    navigation.goBack();
  };

  const handleModeChange = (newMode: CaptureMode) => {
    if (newMode === mode) return;
    SpeechService.cancelListening();
    setMode(newMode);
  };

  return (
    <View style={styles.backdrop}>
      <SafeAreaView style={styles.panel}>
        {/* Dismiss handle */}
        <TouchableOpacity onPress={handleClose} style={styles.handleArea}>
          <View style={styles.handle} />
        </TouchableOpacity>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'voice' && styles.modeBtnActive]}
            onPress={() => handleModeChange('voice')}>
            <Text
              style={[
                styles.modeBtnLabel,
                mode === 'voice' && styles.modeBtnLabelActive,
              ]}>
              🎤 Voice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'text' && styles.modeBtnActive]}
            onPress={() => handleModeChange('text')}>
            <Text
              style={[
                styles.modeBtnLabel,
                mode === 'text' && styles.modeBtnLabelActive,
              ]}>
              ⌨️ Type
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content — swaps between voice and text modes */}
        <View style={styles.content}>
          {mode === 'voice' ? <VoiceCaptureMode /> : <TextCaptureMode />}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: `${colors.surface}D9`, // 85% opacity
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: colors.surfaceContainerLow,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    minHeight: '55%',
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
  },
  modeToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  modeBtnActive: {
    backgroundColor: colors.tertiaryContainer,
  },
  modeBtnLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  modeBtnLabelActive: {
    color: colors.tertiary,
  },
  content: {
    flex: 1,
    minHeight: 280,
  },
});
