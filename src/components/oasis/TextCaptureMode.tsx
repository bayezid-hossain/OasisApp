import { useKeyboardHeight, useTextCapture } from '@/hooks';
import { useCaptureStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';
import type { NoteType } from '@/types';
import { classifyNote } from '@/utils';
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const TYPE_COLORS: Record<NoteType, string> = {
  reminder: '#FFB347',
  idea: colors.tertiary,
  contact: '#87CEEB',
  note: colors.primary,
};

const TYPE_LABELS: Record<NoteType, string> = {
  reminder: '⏰ Reminder',
  idea: '💡 Idea',
  contact: '📞 Contact',
  note: '📝 Note',
};

export function TextCaptureMode() {
  const { textDraft, setTextDraft, status } = useCaptureStore();
  const { submitText } = useTextCapture();
  const kbHeight = useKeyboardHeight();
  const [liveType, setLiveType] = useState<NoteType | null>(null);
  const sendBtnOpacity = useSharedValue(0);
  const sendBtnScale = useSharedValue(0.8);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (text: string) => {
    setTextDraft(text);

    // Animate send button
    if (text.trim().length > 0) {
      sendBtnOpacity.value = withSpring(1);
      sendBtnScale.value = withSpring(1);
    } else {
      sendBtnOpacity.value = withSpring(0);
      sendBtnScale.value = withSpring(0.8);
    }

    // Live classification (debounced 300ms)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text.trim().length > 3) {
        setLiveType(classifyNote(text).type);
      } else {
        setLiveType(null);
      }
    }, 300);
  };

  const sendStyle = useAnimatedStyle(() => ({
    opacity: sendBtnOpacity.value,
    transform: [{ scale: sendBtnScale.value }],
  }));

  const isSaved = status === 'saved';

  return (
    <View style={styles.keyboardView}>
      <View style={[
        styles.container,
        { paddingBottom: kbHeight > 0 ? kbHeight + spacing.lg : spacing.xl }
      ]}>
        {isSaved ? (
          <Text style={styles.savedLabel}>Thought Captured</Text>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={textDraft}
              onChangeText={handleChange}
              placeholder="What's on your mind?"
              placeholderTextColor={`${colors.onSurfaceVariant}80`}
              multiline
              autoFocus
              cursorColor={colors.tertiary}
              selectionColor={`${colors.tertiary}60`}
            />

            <View style={styles.actions}>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                {liveType && (
                  <View
                    style={[
                      styles.typeBadge,
                      { borderColor: TYPE_COLORS[liveType], marginTop: 0 },
                    ]}>
                    <Text style={[styles.typeLabel, { color: TYPE_COLORS[liveType] }]}>
                      {TYPE_LABELS[liveType]}
                    </Text>
                  </View>
                )}
              </View>

              <Animated.View style={sendStyle}>
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={() => submitText(textDraft)}
                  disabled={!textDraft.trim()}>
                  <Text style={styles.sendLabel}>Save</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing['2xl'],
    justifyContent: 'flex-end',
  },
  input: {
    ...typography.titleMd,
    color: colors.onSurface,
    minHeight: 80,
    maxHeight: 200,
    textAlignVertical: 'top',
    paddingVertical: spacing.md,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  typeLabel: {
    ...typography.labelMd,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  sendBtn: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  sendLabel: {
    ...typography.labelLg,
    color: colors.tertiary,
  },
  savedLabel: {
    ...typography.headlineSm,
    color: colors.tertiary,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
});
