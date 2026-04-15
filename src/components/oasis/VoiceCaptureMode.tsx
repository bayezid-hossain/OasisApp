import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import {DeviceEventEmitter} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {OasisRing} from './OasisRing';
import {WaveformBars} from './WaveformBars';
import {colors, typography, spacing, radius} from '@/theme';
import {useCaptureStore} from '@/stores';
import {useVoiceCapture} from '@/hooks';

export function VoiceCaptureMode() {
  const {status, partialTranscript} = useCaptureStore();
  const {startCapture, stopCapture, cancelCapture} = useVoiceCapture();
  const [amplitude, setAmplitude] = useState(0);

  const isListening  = status === 'listening';
  const isProcessing = status === 'processing' || status === 'starting';
  const isSaved      = status === 'saved';
  const isError      = status === 'error';

  const stopScale = useSharedValue(1);
  useEffect(() => {
    if (isListening) {
      stopScale.value = withRepeat(
        withSequence(
          withTiming(1.07, {duration: 800, easing: Easing.inOut(Easing.ease)}),
          withTiming(1.00, {duration: 800, easing: Easing.inOut(Easing.ease)}),
        ),
        -1,
        false,
      );
    } else {
      stopScale.value = withTiming(1, {duration: 200});
    }
  }, [isListening]);

  const stopBtnAnim = useAnimatedStyle(() => ({
    transform: [{scale: stopScale.value}],
  }));

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'onAmplitudeUpdate',
      ({amplitude: a}) => setAmplitude(a as number),
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    startCapture();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRingPress = () => {
    if (isListening) stopCapture();
    else if (status === 'idle' || isError) startCapture();
  };

  const statusLabel =
    status === 'idle'       ? 'Tap to speak'     :
    status === 'starting'   ? 'Starting…'        :
    status === 'listening'  ? 'Listening…'       :
    status === 'processing' ? 'Saving…'          :
    status === 'saved'      ? 'Thought captured' :
    status === 'error'      ? 'Try again'        : '';

  return (
    <View style={styles.container}>
      <OasisRing size={88} isActive={isListening} onPress={handleRingPress} />
      <WaveformBars amplitude={amplitude} active={isListening} />

      {partialTranscript ? (
        <Text style={styles.transcript} numberOfLines={3}>
          {partialTranscript}
        </Text>
      ) : null}

      <Text style={[
        styles.statusLabel,
        isSaved && styles.savedLabel,
        isError && styles.errorLabel,
      ]}>
        {statusLabel}
      </Text>

      {/* Stop + Cancel — visible while recording or saving */}
      {(isListening || isProcessing) && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={cancelCapture}
            activeOpacity={0.7}>
            <Text style={styles.cancelLabel}>✕  Cancel</Text>
          </TouchableOpacity>

          <Animated.View style={stopBtnAnim}>
            <TouchableOpacity
              style={[styles.stopBtn, isProcessing && styles.stopBtnBusy]}
              onPress={stopCapture}
              activeOpacity={0.8}
              disabled={isProcessing}>
              <View style={styles.stopDot} />
              <Text style={styles.stopLabel}>
                {isProcessing ? 'Saving…' : 'Stop & Save'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {isSaved && (
        <TouchableOpacity onPress={startCapture} style={styles.restartBtn}>
          <Text style={styles.restartLabel}>+ Capture another</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: (Platform.OS === 'ios' ? spacing.xl : 0),
  },
  transcript: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  statusLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  savedLabel:  {color: colors.tertiary},
  errorLabel:  {color: '#f44336'},
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.tertiary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    minWidth: 140,
    justifyContent: 'center',
  },
  stopBtnBusy: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.surface,
  },
  stopLabel: {
    ...typography.labelLg,
    color: colors.surface,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  cancelLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  restartBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  restartLabel: {
    ...typography.labelMd,
    color: colors.tertiary,
  },
});
