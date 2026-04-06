/**
 * Converts time strings detected in note text to epoch milliseconds.
 * Mirrors TimeParser.kt logic.
 */
export function parseTimeFromText(text: string): number | undefined {
  const lower = text.toLowerCase();
  const now = new Date();

  // "at 8 PM", "at 8:30 AM"
  const explicitTime = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i.exec(lower);
  if (explicitTime) {
    let hours = parseInt(explicitTime[1], 10);
    const mins = parseInt(explicitTime[2] ?? '0', 10);
    const meridiem = explicitTime[3]?.toLowerCase();
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    const d = new Date(now);
    d.setHours(hours, mins, 0, 0);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1); // next occurrence
    return d.getTime();
  }

  // "tomorrow"
  if (lower.includes('tomorrow')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0); // default 9 AM
    return d.getTime();
  }

  // "tonight"
  if (lower.includes('tonight')) {
    const d = new Date(now);
    d.setHours(20, 0, 0, 0);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }

  // "in 30 minutes"
  const inN = /\bin\s+(\d+)\s+(hours?|minutes?|mins?)\b/i.exec(lower);
  if (inN) {
    const qty = parseInt(inN[1], 10);
    const unit = inN[2].toLowerCase();
    const ms = unit.startsWith('h') ? qty * 60 * 60 * 1000 : qty * 60 * 1000;
    return now.getTime() + ms;
  }

  return undefined;
}

export function formatReminderTime(epochMs: number): string {
  const d = new Date(epochMs);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow =
    d.toDateString() ===
    new Date(now.getTime() + 86400000).toDateString();

  const time = d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

  if (isToday) return `Today at ${time}`;
  if (isTomorrow) return `Tomorrow at ${time}`;
  return `${d.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})} at ${time}`;
}
