import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {DeviceEventEmitter} from 'react-native';
import {OasisRing} from './OasisRing';
import {WaveformBars} from './WaveformBars';
import {colors, typography, spacing} from '@/theme';
import {useCaptureStore} from '@/stores';
import {useVoiceCapture} from '@/hooks';

export function VoiceCaptureMode() {
  const {status, partialTranscript} = useCaptureStore();
  const {startCapture, stopCapture, cancelCapture} = useVoiceCapture();
  const [amplitude, setAmplitude] = useState(0);

  const isListening = status === 'listening';
  const isSaved = status === 'saved';

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('onAmplitudeUpdate', ({amplitude: a}) => {
      setAmplitude(a as number);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Auto-start on mount
    startCapture();
  }, []);

  const handleRingPress = () => {
    if (isListening) {
      stopCapture();
    } else if (status === 'idle' || status === 'error') {
      startCapture();
    }
  };

  const statusLabel = {
    idle: 'Tap to speak',
    starting: 'Starting…',
    listening: 'Listening…',
    typing: '',
    processing: 'Saving…',
    saved: 'Thought Captured',
    error: 'Try again',
  }[status];

  return (
    <View style={styles.container}>
      <OasisRing
        size={88}
        isActive={isListening}
        onPress={handleRingPress}
      />

      <WaveformBars amplitude={amplitude} active={isListening} />

      {partialTranscript ? (
        <Text style={styles.transcript} numberOfLines={3}>
          {partialTranscript}
        </Text>
      ) : null}

      <Text style={[styles.statusLabel, isSaved && styles.savedLabel]}>
        {statusLabel}
      </Text>

      {!isListening && status !== 'saved' && (
        <Text style={styles.hint}>Tap ring to end</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing['2xl'],
  },
  transcript: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
  },
  statusLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  savedLabel: {
    color: colors.tertiary,
  },
  hint: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
});
