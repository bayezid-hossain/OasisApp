package com.oasis.app.classifier

import com.oasis.app.utils.TimeParser
import java.util.regex.Pattern

object NoteClassifier {

    private val REMINDER_WORDS = setOf(
        "remind", "reminder", "don't forget", "dont forget",
        "remember", "alert", "schedule", "don't let me forget",
    )
    private val IDEA_WORDS = setOf(
        "idea", "build", "startup", "concept", "what if", "create",
        "launch", "business", "product", "app", "feature",
    )
    private val PHONE_PATTERN = Pattern.compile(
        "\\b(\\+?1?\\s*[-.\\(]?\\d{3}[)\\-.\\s]?\\d{3}[-.\\s]?\\d{4})\\b"
    )

    data class Result(
        val type: String,           // "note"|"reminder"|"idea"|"contact"
        val confidence: Float,
        val detectedTimeMs: Long?,  // epoch ms for reminder, null otherwise
    )

    fun classify(text: String): Result {
        val lower = text.lowercase()
        val detectedTime = TimeParser.parse(text)

        val hasTime = detectedTime != null
        val hasReminderWord = REMINDER_WORDS.any { lower.contains(it) }
        val hasPhone = PHONE_PATTERN.matcher(text).find()
        val hasIdeaWord = IDEA_WORDS.any { lower.contains(it) }

        return when {
            (hasReminderWord || hasTime) && hasTime -> Result(
                type = "reminder",
                confidence = if (hasReminderWord && hasTime) 0.95f else 0.75f,
                detectedTimeMs = detectedTime,
            )
            hasPhone -> Result("contact", 0.90f, null)
            hasIdeaWord -> Result("idea", 0.80f, null)
            else -> Result("note", 0.60f, null)
        }
    }
}
