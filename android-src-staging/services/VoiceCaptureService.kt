package com.oasis.app.services

import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.oasis.app.database.NoteEntity
import com.oasis.app.database.OasisDatabase
import com.oasis.app.utils.NotificationHelper
import com.oasis.app.widget.OasisWidgetProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.util.UUID

/**
 * Audio-only capture service.
 *
 * Records raw audio via MediaRecorder and saves a voice-note entity (text="")
 * with the audio file path. Transcription is deferred to a future background
 * step (Grok API) — no on-device SpeechRecognizer is used here.
 */
class VoiceCaptureService : Service() {

    companion object {
        const val TAG = "VoiceCaptureService"
        const val ACTION_START_LISTENING  = "com.oasis.app.ACTION_START_LISTENING"
        const val ACTION_STOP_LISTENING   = "com.oasis.app.ACTION_STOP_LISTENING"
        const val ACTION_CANCEL_LISTENING = "com.oasis.app.ACTION_CANCEL_LISTENING"

        const val EXTRA_LANGUAGE = "language"

        // Events emitted to React Native
        const val EVENT_AMPLITUDE = "onAmplitudeUpdate"
        const val EVENT_ERROR     = "onSpeechError"
        const val EVENT_RESULT    = "onSpeechResult"

        @Volatile var isRecording = false
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val serviceScope = CoroutineScope(Dispatchers.IO)

    private var mediaRecorder: MediaRecorder? = null
    private var currentAudioPath: String? = null
    private var currentNoteId: String? = null
    private var recordingStartedAt: Long = 0L

    private var amplitudeSampler: Runnable? = null

    // ── Lifecycle ────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createChannels(this)
        NotificationHelper.cancelIdleNotification(this)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NotificationHelper.NOTIF_ID_RECORDING,
                    NotificationHelper.buildRecordingNotification(this),
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE,
                )
            } else {
                startForeground(
                    NotificationHelper.NOTIF_ID_RECORDING,
                    NotificationHelper.buildRecordingNotification(this),
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "startForeground failed", e)
        }
        Log.d(TAG, "Service created (audio-only)")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_LISTENING  -> startListening()
            ACTION_STOP_LISTENING   -> stopListening()
            ACTION_CANCEL_LISTENING -> cancelListening()
        }
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        if (isRecording) {
            // Treat abrupt destroy as cancel (don't keep partial file)
            stopAudioRecording(keep = false)
        }
        stopAmplitudeSampler()
        isRecording = false
        super.onDestroy()
    }

    // ── Start / Stop / Cancel ────────────────────────────────────────────────

    private fun startListening() {
        if (isRecording) return
        Log.d(TAG, "startListening at ${System.currentTimeMillis()}")

        currentNoteId = UUID.randomUUID().toString()
        val ok = startAudioRecording(currentNoteId!!)
        if (!ok) {
            emitError(-2, "Failed to start audio recording")
            stopSelfAndDismissNotification()
            return
        }
        isRecording = true
        recordingStartedAt = System.currentTimeMillis()
        startAmplitudeSampler()

        // Tell the widget to switch to recording state
        sendBroadcast(Intent(OasisWidgetProvider.ACTION_RECORDING_STARTED).apply {
            setPackage(packageName)
            putExtra(OasisWidgetProvider.EXTRA_START_TIME,
                android.os.SystemClock.elapsedRealtime())
        })
    }

    private fun stopListening() {
        if (!isRecording) {
            stopSelfAndDismissNotification()
            return
        }
        mainHandler.post {
            stopAmplitudeSampler()
            val noteId = currentNoteId ?: UUID.randomUUID().toString()
            val durationMs = System.currentTimeMillis() - recordingStartedAt
            val path = stopAudioRecording(keep = true)
            isRecording = false

            if (path != null) {
                // Emit to RN (for instant optimistic update) AND persist natively.
                tryEmitEvent(EVENT_RESULT, Arguments.createMap().apply {
                    putString("transcript", "")
                    putString("noteId", noteId)
                    putString("audioPath", path)
                    putDouble("durationMs", durationMs.toDouble())
                })
                saveDirectlyToDb(noteId, path, durationMs)
            } else {
                emitError(-3, "Audio file missing after stop")
            }

            currentNoteId = null
            currentAudioPath = null
            broadcastRecordingStopped()
            stopSelfAndDismissNotification()
        }
    }

    private fun cancelListening() {
        mainHandler.post {
            stopAmplitudeSampler()
            stopAudioRecording(keep = false)
            isRecording = false
            currentNoteId = null
            currentAudioPath = null
            broadcastRecordingStopped()
            stopSelfAndDismissNotification()
        }
    }

    private fun broadcastRecordingStopped() {
        sendBroadcast(Intent(OasisWidgetProvider.ACTION_RECORDING_STOPPED).apply {
            setPackage(packageName)
        })
    }

    // ── MediaRecorder ─────────────────────────────────────────────────────────

    private fun startAudioRecording(noteId: String): Boolean {
        return try {
            val audioDir = File(filesDir, "audio").apply { mkdirs() }
            val audioFile = File(audioDir, "$noteId.m4a")
            currentAudioPath = audioFile.absolutePath

            @Suppress("DEPRECATION")
            val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(this)
            } else {
                MediaRecorder()
            }
            recorder.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(16000)
                setAudioEncodingBitRate(64000)
                setOutputFile(audioFile.absolutePath)
                prepare()
                start()
            }
            mediaRecorder = recorder
            Log.d(TAG, "Audio recording started: ${audioFile.absolutePath}")
            true
        } catch (e: Exception) {
            Log.e(TAG, "MediaRecorder failed to start", e)
            currentAudioPath = null
            mediaRecorder = null
            false
        }
    }

    /** Returns the final audio path if kept, else null. */
    private fun stopAudioRecording(keep: Boolean): String? {
        val path = currentAudioPath
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
        } catch (e: Exception) {
            Log.w(TAG, "MediaRecorder stop error: ${e.message}")
        } finally {
            mediaRecorder = null
        }
        if (!keep) {
            path?.let { File(it).delete() }
            currentAudioPath = null
            return null
        }
        // Verify file exists and is non-empty
        if (path != null) {
            val f = File(path)
            if (!f.exists() || f.length() == 0L) {
                Log.w(TAG, "Audio file missing or empty: $path")
                return null
            }
        }
        return path
    }

    // ── Amplitude sampling (from MediaRecorder) ──────────────────────────────

    private fun startAmplitudeSampler() {
        stopAmplitudeSampler()
        amplitudeSampler = object : Runnable {
            override fun run() {
                if (!isRecording) return
                val amp = try {
                    mediaRecorder?.maxAmplitude ?: 0
                } catch (_: Exception) { 0 }
                // Normalize: maxAmplitude is 0..32767; log-scale for perception
                val normalized = if (amp > 0) {
                    (Math.log10(amp.toDouble()) / Math.log10(32767.0)).toFloat()
                        .coerceIn(0f, 1f)
                } else 0f
                emitAmplitude(normalized)
                mainHandler.postDelayed(this, 80)
            }
        }
        mainHandler.postDelayed(amplitudeSampler!!, 80)
    }

    private fun stopAmplitudeSampler() {
        amplitudeSampler?.let { mainHandler.removeCallbacks(it) }
        amplitudeSampler = null
    }

    // ── Direct DB save ───────────────────────────────────────────────────────

    private fun saveDirectlyToDb(noteId: String, audioPath: String, durationMs: Long) {
        serviceScope.launch {
            try {
                val entity = NoteEntity(
                    id          = noteId,
                    text        = "",  // transcription deferred to background step
                    createdAt   = System.currentTimeMillis(),
                    type        = "note",
                    inputSource = "voice",
                    tags        = "",
                    confidence  = 0.0f,
                    audioPath   = audioPath,
                )
                OasisDatabase.getInstance(applicationContext).noteDao().insert(entity)

                val nm = getSystemService(NotificationManager::class.java)
                nm.notify(
                    NotificationHelper.NOTIF_ID_SAVED,
                    NotificationHelper.buildSavedNotification(applicationContext, "Voice note saved")
                )
                Log.d(TAG, "Voice note saved: $noteId (${durationMs}ms)")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to save voice note", e)
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun stopSelfAndDismissNotification() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        NotificationHelper.postIdleNotification(this)
    }

    private fun emitAmplitude(amplitude: Float) {
        tryEmitEvent(EVENT_AMPLITUDE, Arguments.createMap().apply {
            putDouble("amplitude", amplitude.toDouble())
        })
    }

    private fun emitError(code: Int, message: String) {
        tryEmitEvent(EVENT_ERROR, Arguments.createMap().apply {
            putInt("code", code)
            putString("message", message)
        })
    }

    private fun tryEmitEvent(
        eventName: String,
        params: com.facebook.react.bridge.WritableMap
    ): Boolean {
        return try {
            val app = application as? ReactApplication ?: return false
            val ctx = app.reactNativeHost.reactInstanceManager.currentReactContext
                ?: return false
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, params)
            true
        } catch (_: Exception) {
            false
        }
    }
}
