package com.oasis.app.database

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "reminders",
    foreignKeys = [
        ForeignKey(
            entity = NoteEntity::class,
            parentColumns = ["id"],
            childColumns = ["noteId"],
            onDelete = ForeignKey.CASCADE,
        )
    ],
    indices = [Index("noteId")]
)
data class ReminderEntity(
    @PrimaryKey val reminderId: String,
    val noteId: String,
    val scheduledAt: Long,
    val label: String,
    val alarmRequestCode: Int, // needed to cancel via AlarmManager
    val isFired: Boolean = false,
)
