package com.oasis.app.database

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notes")
data class NoteEntity(
    @PrimaryKey val id: String,
    val text: String,
    val createdAt: Long,          // epoch ms
    val type: String,             // "note"|"reminder"|"idea"|"contact"
    val inputSource: String,      // "voice"|"text"
    val tags: String,             // JSON array e.g. ["family","idea"]
    val confidence: Float,        // 0.0–1.0
    val reminderAt: Long? = null, // epoch ms, null if no reminder
    val reminderFired: Boolean = false,
    val isCompleted: Boolean = false,
)
