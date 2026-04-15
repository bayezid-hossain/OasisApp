package com.oasis.app.modules

import android.util.Log
import com.facebook.react.bridge.*
import com.oasis.app.classifier.NoteClassifier
import com.oasis.app.database.NoteDao
import com.oasis.app.database.NoteEntity
import com.oasis.app.database.OasisDatabase
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject

class StorageModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val dao: NoteDao by lazy {
        OasisDatabase.getInstance(reactContext).noteDao()
    }

    override fun getName(): String = "StorageModule"

    @ReactMethod
    fun saveNote(noteJson: String, promise: Promise) {
        scope.launch {
            try {
                val obj = JSONObject(noteJson)
                val text = obj.getString("text")
                val classification = if (!obj.has("type") || obj.getString("type").isBlank()) {
                    NoteClassifier.classify(text)
                } else null

                val entity = NoteEntity(
                    id = obj.getString("id"),
                    text = text,
                    createdAt = obj.getLong("createdAt"),
                    type = classification?.type ?: obj.getString("type"),
                    inputSource = obj.optString("inputSource", "text"),
                    tags = obj.optString("tags", "[]"),
                    confidence = classification?.confidence ?: obj.optDouble("confidence", 0.6).toFloat(),
                    reminderAt = classification?.detectedTimeMs
                        ?: if (obj.has("reminderAt") && !obj.isNull("reminderAt"))
                            obj.getLong("reminderAt") else null,
                    reminderFired = obj.optBoolean("reminderFired", false),
                    isCompleted = obj.optBoolean("isCompleted", false),
                    audioPath = obj.optString("audioPath", "").takeIf { it.isNotBlank() },
                )
                dao.insert(entity)
                Log.d("StorageModule", "Saved note id=${entity.id} text=${entity.text.take(40)}")
                val result = Arguments.createMap()
                result.putString("id", entity.id)
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e("StorageModule", "saveNote failed", e)
                promise.reject("SAVE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getNotes(limit: Int, promise: Promise) {
        scope.launch {
            try {
                val notes = dao.getAll(limit)
                promise.resolve(notesToWritableArray(notes))
            } catch (e: Exception) {
                promise.reject("GET_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun searchNotes(query: String, promise: Promise) {
        scope.launch {
            try {
                val notes = dao.search(query)
                promise.resolve(notesToWritableArray(notes))
            } catch (e: Exception) {
                promise.reject("SEARCH_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun markNoteComplete(id: String, promise: Promise) {
        scope.launch {
            try {
                dao.markComplete(id)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("COMPLETE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun deleteNote(id: String, promise: Promise) {
        scope.launch {
            try {
                dao.delete(id)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DELETE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getLatestNote(promise: Promise) {
        scope.launch {
            try {
                val note = dao.getLatest()
                if (note != null) {
                    promise.resolve(noteToWritableMap(note))
                } else {
                    promise.resolve(null)
                }
            } catch (e: Exception) {
                promise.reject("GET_LATEST_ERROR", e.message, e)
            }
        }
    }

    private fun noteToWritableMap(note: NoteEntity): WritableMap {
        val map = Arguments.createMap()
        map.putString("id", note.id)
        map.putString("text", note.text)
        map.putDouble("createdAt", note.createdAt.toDouble())
        map.putString("type", note.type)
        map.putString("inputSource", note.inputSource)
        map.putString("tags", note.tags)
        map.putDouble("confidence", note.confidence.toDouble())
        note.reminderAt?.let { map.putDouble("reminderAt", it.toDouble()) }
        map.putBoolean("reminderFired", note.reminderFired)
        map.putBoolean("isCompleted", note.isCompleted)
        note.audioPath?.let { map.putString("audioPath", it) }
        return map
    }

    private fun notesToWritableArray(notes: List<NoteEntity>): WritableArray {
        val arr = Arguments.createArray()
        notes.forEach { arr.pushMap(noteToWritableMap(it)) }
        return arr
    }
}
