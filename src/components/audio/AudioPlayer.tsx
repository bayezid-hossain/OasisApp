import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {AudioService} from '@/services/AudioService';
import {useAudioPlayerStore} from '@/stores';
import {colors, radius, spacing, typography} from '@/theme';

interface Props {
  audioPath: string;
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function AudioPlayer({audioPath}: Props) {
  const currentPath = useAudioPlayerStore(s => s.currentPath);
  const setCurrent = useAudioPlayerStore(s => s.setCurrent);

  const isActive = currentPath === audioPath;

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const subRefs = useRef<any[]>([]);

  // Fetch duration once so the track length is shown even when idle.
  useEffect(() => {
    let cancelled = false;
    AudioService.getInfo(audioPath)
      .then(info => {
        if (!cancelled) setDuration(info.duration);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [audioPath]);

  // Only subscribe to progress/end events while this player is the active one.
  useEffect(() => {
    if (!isActive) {
      setPosition(0);
      setIsPaused(false);
      return;
    }
    subRefs.current.push(
      AudioService.onProgress(e => {
        setPosition(e.position);
        if (e.duration > 0) setDuration(e.duration);
      }),
      AudioService.onEnd(() => {
        setPosition(0);
        setCurrent(null);
      }),
    );
    return () => {
      subRefs.current.forEach(s => s.remove());
      subRefs.current = [];
    };
  }, [isActive, setCurrent]);

  const playing = isActive && !isPaused;

  const toggle = async () => {
    if (isActive) {
      if (isPaused) {
        await AudioService.resume();
        setIsPaused(false);
      } else {
        await AudioService.pause();
        setIsPaused(true);
      }
      return;
    }
    // Another player (or nothing) is active — take over.
    if (currentPath) {
      try {
        await AudioService.stop();
      } catch {}
    }
    setCurrent(audioPath);
    setIsPaused(false);
    const result = await AudioService.play(audioPath);
    setDuration(result.duration);
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggle} style={styles.playBtn} activeOpacity={0.7}>
        <Text style={styles.playIcon}>{playing ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      <View style={styles.right}>
        <View style={styles.trackBg}>
          <View style={[styles.trackFill, {width: `${progress * 100}%`}]} />
        </View>
        <View style={styles.times}>
          <Text style={styles.timeText}>{formatMs(isActive ? position : 0)}</Text>
          <Text style={styles.timeText}>{formatMs(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: colors.surface,
  },
  right: {
    flex: 1,
    gap: spacing.xs,
  },
  trackBg: {
    height: 3,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: 3,
    backgroundColor: colors.tertiary,
    borderRadius: 2,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
});
