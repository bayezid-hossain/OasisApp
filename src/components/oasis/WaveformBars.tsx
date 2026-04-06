import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {colors} from '@/theme';

const BAR_COUNT = 9;
const BAR_MIN_H = 12;
const BAR_MAX_H = 48;
const BAR_WIDTH = 4;
const BAR_GAP = 5;

// Stagger multipliers so bars don't all move identically
const STAGGER = [0.5, 0.7, 0.9, 1.0, 1.1, 0.95, 0.85, 0.65, 0.45];

interface WaveformBarsProps {
  amplitude: number; // 0.0 – 1.0
  active?: boolean;
}

export function WaveformBars({amplitude, active = true}: WaveformBarsProps) {
  const heights = Array.from({length: BAR_COUNT}, () => useSharedValue(BAR_MIN_H));

  useEffect(() => {
    heights.forEach((h, i) => {
      const target = active
        ? BAR_MIN_H + amplitude * BAR_MAX_H * STAGGER[i]
        : BAR_MIN_H;
      h.value = withSpring(target, {damping: 8, stiffness: 120});
    });
  }, [amplitude, active]);

  return (
    <View style={styles.container}>
      {heights.map((h, i) => {
        const style = useAnimatedStyle(() => ({
          height: h.value,
          opacity: active ? 0.6 + amplitude * 0.4 : 0.3,
        }));
        return (
          <Animated.View
            key={i}
            style={[styles.bar, style]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAR_GAP,
    height: BAR_MAX_H + 8,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    backgroundColor: colors.tertiary,
  },
});
