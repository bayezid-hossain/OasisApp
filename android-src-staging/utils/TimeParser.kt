package com.oasis.app.utils

import java.util.Calendar
import java.util.regex.Pattern

object TimeParser {

    private val TIME_PATTERN = Pattern.compile(
        "\\b(at\\s+(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?|tomorrow|tonight|in\\s+(\\d+)\\s+(hours?|minutes?|mins?))\\b",
        Pattern.CASE_INSENSITIVE,
    )

    /**
     * Returns epoch milliseconds for the detected time in [text], or null if none found.
     */
    fun parse(text: String): Long? {
        val lower = text.lowercase()
        val matcher = TIME_PATTERN.matcher(lower)
        if (!matcher.find()) return null

        val matched = matcher.group(0) ?: return null
        val now = Calendar.getInstance()

        return when {
            matched.startsWith("at ") -> {
                val hourStr = matcher.group(2) ?: return null
                val minStr = matcher.group(3) ?: "0"
                val meridiem = matcher.group(4)?.lowercase()

                var hours = hourStr.toIntOrNull() ?: return null
                val mins = minStr.toIntOrNull() ?: 0

                if (meridiem == "pm" && hours < 12) hours += 12
                if (meridiem == "am" && hours == 12) hours = 0

                val cal = Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, hours)
                    set(Calendar.MINUTE, mins)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }
                // If time already passed today, schedule for tomorrow
                if (cal.timeInMillis <= now.timeInMillis) {
                    cal.add(Calendar.DAY_OF_YEAR, 1)
                }
                cal.timeInMillis
            }

            matched.contains("tomorrow") -> {
                Calendar.getInstance().apply {
                    add(Calendar.DAY_OF_YEAR, 1)
                    set(Calendar.HOUR_OF_DAY, 9)
                    set(Calendar.MINUTE, 0)
                    set(Calendar.SECOND, 0)
                }.timeInMillis
            }

            matched.contains("tonight") -> {
                Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, 20)
                    set(Calendar.MINUTE, 0)
                    set(Calendar.SECOND, 0)
                    if (timeInMillis <= now.timeInMillis) add(Calendar.DAY_OF_YEAR, 1)
                }.timeInMillis
            }

            matched.startsWith("in ") -> {
                val qty = matcher.group(5)?.toIntOrNull() ?: return null
                val unit = matcher.group(6)?.lowercase() ?: return null
                val ms = if (unit.startsWith("h")) qty * 3600_000L else qty * 60_000L
                now.timeInMillis + ms
            }

            else -> null
        }
    }
}
