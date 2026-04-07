package com.oasis.app.services

import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.oasis.app.classifier.NoteClassifier
import com.oasis.app.database.NoteEntity
import com.oasis.app.database.OasisDatabase
import com.oasis.app.utils.NotificationHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID

class VoiceCaptureService : Service() {

    companion object {
        const val TAG = "VoiceCaptureService"
        const val ACTION_START_LISTENING  = "com.oasis.app.ACTION_START_LISTENING"
        const val ACTION_STOP_LISTENING   = "com.oasis.app.ACTION_STOP_LISTENING"
        const val ACTION_CANCEL_LISTENING = "com.oasis.app.ACTION_CANCEL_LISTENING"

        // Events emitted to React Native
        const val EVENT_PARTIAL   = "onPartialResult"
        const val EVENT_AMPLITUDE = "onAmplitudeUpdate"
        const val EVENT_ERROR     = "onSpeechError"
        const val EVENT_RESULT    = "onSpeechResult"

        // Shared state so QS tile can poll recording status
        @Volatile var isRecording = false
    }

    private var speechRecognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var amplitudeSampler: Runnable? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO)

    // ── Lifecycle ────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createChannels(this)
        startForeground(
            NotificationHelper.NOTIF_ID_RECORDING,
            NotificationHelper.buildRecordingNotification(this)
        )
        initRecognizer()
        Log.d(TAG, "Service created, recognizer pre-warmed")
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
        isRecording = false
        cancelListeningInternal()
        speechRecognizer?.destroy()
        speechRecognizer = null
        super.onDestroy()
    }

    // ── Recognizer ───────────────────────────────────────────────────────────

    private fun initRecognizer() {
        mainHandler.post {
            if (!SpeechRecognizer.isRecognitionAvailable(this)) {
                emitError(-1, "SpeechRecognizer not available on this device")
                return@post
            }
            speechRecognizer?.destroy()
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
                setRecognitionListener(recognitionListener)
            }
        }
    }

    private fun startListening() {
        if (isRecording) return
        Log.d(TAG, "OASIS_LATENCY: startListening at ${System.currentTimeMillis()}")
        mainHandler.post {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            }
            speechRecognizer?.startListening(intent)
            isRecording = true
            startAmplitudeSampler()
        }
    }

    private fun stopListening() {
        mainHandler.post {
            speechRecognizer?.stopListening()
            stopAmplitudeSampler()
            // Result delivered via onResults callback
        }
    }

    private fun cancelListening() {
        cancelListeningInternal()
        stopSelfAndDismissNotification()
    }

    private fun cancelListeningInternal() {
        mainHandler.post {
            speechRecognizer?.cancel()
            isRecording = false
            stopAmplitudeSampler()
        }
    }

    // ── Amplitude sampling ────────────────────────────────────────────────────

    private fun startAmplitudeSampler() {
        stopAmplitudeSampler()
        amplitudeSampler = object : Runnable {
            override fun run() {
                if (!isRecording) return
                emitAmplitude(0f) // real value comes via onRmsChanged
                mainHandler.postDelayed(this, 50)
            }
        }
        mainHandler.postDelayed(amplitudeSampler!!, 50)
    }

    private fun stopAmplitudeSampler() {
        amplitudeSampler?.let { mainHandler.removeCallbacks(it) }
        amplitudeSampler = null
    }

    // ── Recognition listener ─────────────────────────────────────────────────

    private val recognitionListener = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {
            Log.d(TAG, "OASIS_LATENCY: ready at ${System.currentTimeMillis()}")
        }

        override fun onRmsChanged(rmsdB: Float) {
            val normalized = ((rmsdB + 2f) / 12f).coerceIn(0f, 1f)
            emitAmplitude(normalized)
        }

        override fun onPartialResults(partialResults: Bundle?) {
            val text = partialResults
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?.firstOrNull() ?: return
            emitEvent(EVENT_PARTIAL, Arguments.createMap().apply { putString("text", text) })
        }

        override fun onResults(results: Bundle?) {
            isRecording = false
            stopAmplitudeSampler()
            val transcript = results
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?.firstOrNull() ?: ""

            // Always try to emit to RN (app is open)
            val emitted = tryEmitEvent(EVENT_RESULT, Arguments.createMap().apply {
                putString("transcript", transcript)
            })

            // Fallback: app not open (lock screen / background) — save directly
            if (!emitted && transcript.isNotBlank()) {
                saveDirectlyToDb(transcript)
            }

            initRecognizer()
            stopSelfAndDismissNotification()
        }

        override fun onError(error: Int) {
            isRecording = false
            stopAmplitudeSampler()
            val msg = when (error) {
                SpeechRecognizer.ERROR_AUDIO                 -> "Audio recording error"
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
                SpeechRecognizer.ERROR_NO_MATCH              -> "No speech detected"
                SpeechRecognizer.ERROR_RECOGNIZER_BUSY       -> "Recognizer busy"
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT        -> "No speech input"
                else -> "Speech error ($error)"
            }
            emitError(error, msg)
            initRecognizer()
            stopSelfAndDismissNotification()
        }

        override fun onBeginningOfSpeech() {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onEvent(eventType: Int, params: Bundle?) {}
    }

    // ── Direct DB save (when RN context unavailable — lock screen) ───────────

    private fun saveDirectlyToDb(transcript: String) {
        serviceScope.launch {
            try {
                val result = NoteClassifier.classify(transcript)
                val entity = NoteEntity(
                    id          = UUID.randomUUID().toString(),
                    text        = transcript,
                    createdAt   = System.currentTimeMillis(),
                    type        = result.type,
                    inputSource = "voice",
                    tags        = "",
                    confidence  = result.confidence
                )
                OasisDatabase.getInstance(applicationContext).noteDao().insert(entity)

                // Show "saved" confirmation on lock screen
                val nm = getSystemService(NotificationManager::class.java)
                nm.notify(
                    NotificationHelper.NOTIF_ID_SAVED,
                    NotificationHelper.buildSavedNotification(applicationContext, transcript)
                )
                Log.d(TAG, "Note saved directly to DB (lock screen path): ${transcript.take(40)}")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to save note directly: ${e.message}")
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun stopSelfAndDismissNotification() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
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

    /** Returns true if the event was successfully emitted to a live RN context. */
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

    // Keep old name for callers that don't need return value
    private fun emitEvent(eventName: String, params: com.facebook.react.bridge.WritableMap) {
        tryEmitEvent(eventName, params)
    }
}
