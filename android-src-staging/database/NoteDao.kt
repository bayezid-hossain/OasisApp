package com.oasis.app.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface NoteDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(note: NoteEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReminder(reminder: ReminderEntity)

    @Query("SELECT * FROM notes ORDER BY createdAt DESC")
    fun getAllFlow(): Flow<List<NoteEntity>>

    @Query("SELECT * FROM notes ORDER BY createdAt DESC LIMIT :limit")
    suspend fun getAll(limit: Int = 200): List<NoteEntity>

    @Query("SELECT * FROM notes WHERE text LIKE '%' || :query || '%' ORDER BY createdAt DESC")
    suspend fun search(query: String): List<NoteEntity>

    @Query("SELECT * FROM notes ORDER BY createdAt DESC LIMIT 1")
    suspend fun getLatest(): NoteEntity?

    @Query("SELECT * FROM notes WHERE createdAt >= :since ORDER BY createdAt DESC")
    suspend fun getNotesAfter(since: Long): List<NoteEntity>

    @Query("UPDATE notes SET isCompleted = 1 WHERE id = :id")
    suspend fun markComplete(id: String)

    @Query("UPDATE notes SET reminderFired = 1 WHERE id = :id")
    suspend fun markReminderFired(id: String)

    @Query("DELETE FROM notes WHERE id = :id")
    suspend fun delete(id: String)

    @Query("SELECT * FROM reminders WHERE noteId = :noteId LIMIT 1")
    suspend fun getReminderForNote(noteId: String): ReminderEntity?

    @Query("DELETE FROM reminders WHERE reminderId = :reminderId")
    suspend fun deleteReminder(reminderId: String)
}
