/**
 * The Oasis Ring — pulsating gradient orb.
 * Inner gradient uses Skia RadialGradient; outer pulses use Reanimated.
 */
import React, {useEffect} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import {Canvas, Circle, RadialGradient, vec} from '@shopify/react-native-skia';
import {colors} from '@/theme';

interface OasisRingProps {
  size?: number;
  onPress?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const PULSE_DURATION = 1800;
const PULSE_STAGGER = 400;

export function OasisRing({
  size = 80,
  onPress,
  isActive = false,
  disabled = false,
}: OasisRingProps) {
  const scale = useSharedValue(1);
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.4);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.4);

  useEffect(() => {
    if (isActive) {
      ring1Scale.value = withRepeat(
        withSequence(
          withTiming(1.25, {duration: PULSE_DURATION}),
          withTiming(1, {duration: 0}),
        ),
        -1,
        false,
      );
      ring1Opacity.value = withRepeat(
        withSequence(
          withTiming(0, {duration: PULSE_DURATION}),
          withTiming(0.4, {duration: 0}),
        ),
        -1,
        false,
      );

      setTimeout(() => {
        ring2Scale.value = withRepeat(
          withSequence(
            withTiming(1.25, {duration: PULSE_DURATION}),
            withTiming(1, {duration: 0}),
          ),
          -1,
          false,
        );
        ring2Opacity.value = withRepeat(
          withSequence(
            withTiming(0, {duration: PULSE_DURATION}),
            withTiming(0.4, {duration: 0}),
          ),
          -1,
          false,
        );
      }, PULSE_STAGGER);
    } else {
      ring1Scale.value = withTiming(1);
      ring1Opacity.value = withTiming(0);
      ring2Scale.value = withTiming(1);
      ring2Opacity.value = withTiming(0);
    }
  }, [isActive]);

  const handlePress = () => {
    scale.value = withSpring(0.9, {damping: 10, stiffness: 300}, () => {
      scale.value = withSpring(1, {damping: 10, stiffness: 100});
    });
    onPress?.();
  };

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{scale: ring1Scale.value}],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{scale: ring2Scale.value}],
    opacity: ring2Opacity.value,
  }));

  const r = size / 2;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.9}
      style={[{width: size * 1.6, height: size * 1.6, alignItems: 'center', justifyContent: 'center'}]}>
      {/* Pulse rings */}
      <Animated.View
        style={[styles.pulseRing, ring2Style, {width: size * 1.4, height: size * 1.4, borderRadius: size * 0.7}]}
      />
      <Animated.View
        style={[styles.pulseRing, ring1Style, {width: size * 1.2, height: size * 1.2, borderRadius: size * 0.6}]}
      />

      {/* Main orb */}
      <Animated.View style={outerStyle}>
        <Canvas style={{width: size, height: size}}>
          <Circle cx={r} cy={r} r={r}>
            <RadialGradient
              c={vec(r, r)}
              r={r}
              colors={[colors.tertiary, colors.tertiaryContainer]}
            />
          </Circle>
        </Canvas>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: colors.tertiary,
  },
});
