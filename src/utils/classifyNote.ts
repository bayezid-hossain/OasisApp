/**
 * TypeScript mirror of NoteClassifier.kt
 * Used for optimistic UI — shows classification badge instantly before the
 * Kotlin result comes back.
 */
import type {NoteType} from '@/types';

const REMINDER_WORDS = [
  'remind', 'reminder', "don't forget", 'remember', 'alert', 'schedule',
];
const IDEA_WORDS = [
  'idea', 'build', 'startup', 'concept', 'what if', 'create', 'launch',
  'business', 'app', 'product',
];
const PHONE_PATTERN =
  /\b(\+?1?\s*[-.]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/;
const TIME_PATTERN =
  /\b(at\s+\d{1,2}(:\d{2})?\s*(am|pm)?|tomorrow|tonight|next\s+\w+|in\s+\d+\s+(hours?|minutes?|mins?))\b/i;

export interface ClassificationResult {
  type: NoteType;
  confidence: number;
  detectedTime?: string;
}

export function classifyNote(text: string): ClassificationResult {
  const lower = text.toLowerCase();

  const hasTime = TIME_PATTERN.test(lower);
  const hasReminderWord = REMINDER_WORDS.some(w => lower.includes(w));
  const hasPhone = PHONE_PATTERN.test(text);
  const hasIdeaWord = IDEA_WORDS.some(w => lower.includes(w));

  if ((hasReminderWord || hasTime) && hasTime) {
    const match = TIME_PATTERN.exec(lower);
    return {
      type: 'reminder',
      confidence: hasReminderWord && hasTime ? 0.95 : 0.75,
      detectedTime: match?.[0],
    };
  }

  if (hasPhone) {
    return {type: 'contact', confidence: 0.9};
  }

  if (hasIdeaWord) {
    return {type: 'idea', confidence: 0.8};
  }

  return {type: 'note', confidence: 0.6};
}
