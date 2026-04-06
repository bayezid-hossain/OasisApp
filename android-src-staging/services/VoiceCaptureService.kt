package com.oasis.app.services

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
import com.oasis.app.utils.NotificationHelper

class VoiceCaptureService : Service() {

    companion object {
        const val TAG = "VoiceCaptureService"
        const val ACTION_START_LISTENING = "com.oasis.app.ACTION_START_LISTENING"
        const val ACTION_STOP_LISTENING = "com.oasis.app.ACTION_STOP_LISTENING"
        const val ACTION_CANCEL_LISTENING = "com.oasis.app.ACTION_CANCEL_LISTENING"

        // Events emitted to React Native
        const val EVENT_PARTIAL = "onPartialResult"
        const val EVENT_AMPLITUDE = "onAmplitudeUpdate"
        const val EVENT_ERROR = "onSpeechError"
        const val EVENT_RESULT = "onSpeechResult"
    }

    private var speechRecognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var isListening = false
    private var amplitudeSampler: Runnable? = null

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
            ACTION_START_LISTENING -> startListening()
            ACTION_STOP_LISTENING -> stopListening()
            ACTION_CANCEL_LISTENING -> cancelListening()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        cancelListening()
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
        if (isListening) return
        Log.d(TAG, "OASIS_LATENCY: startListening called at ${System.currentTimeMillis()}")
        mainHandler.post {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            }
            speechRecognizer?.startListening(intent)
            isListening = true
            startAmplitudeSampler()
        }
    }

    private fun stopListening() {
        mainHandler.post {
            speechRecognizer?.stopListening()
            stopAmplitudeSampler()
        }
    }

    private fun cancelListening() {
        mainHandler.post {
            speechRecognizer?.cancel()
            isListening = false
            stopAmplitudeSampler()
        }
    }

    // ── Amplitude sampling (50ms interval → waveform bars) ──────────────────

    private fun startAmplitudeSampler() {
        stopAmplitudeSampler()
        amplitudeSampler = object : Runnable {
            override fun run() {
                if (!isListening) return
                // RmsDbLevel is 0–10+ in practice; normalize to 0–1
                val rms = try {
                    // SpeechRecognizer does not expose getRmsDbLevel publicly in all API levels;
                    // we emit a dummy value and let the real callback provide it via onRmsChanged.
                    0f
                } catch (_: Exception) { 0f }
                emitAmplitude(rms)
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
            Log.d(TAG, "OASIS_LATENCY: ready for speech at ${System.currentTimeMillis()}")
        }

        override fun onRmsChanged(rmsdB: Float) {
            // Normalize: typical range is -2 to 10 dB
            val normalized = ((rmsdB + 2f) / 12f).coerceIn(0f, 1f)
            emitAmplitude(normalized)
        }

        override fun onPartialResults(partialResults: Bundle?) {
            val results = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val text = results?.firstOrNull() ?: return
            emitEvent(EVENT_PARTIAL, Arguments.createMap().apply {
                putString("text", text)
            })
        }

        override fun onResults(results: Bundle?) {
            isListening = false
            stopAmplitudeSampler()
            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val transcript = matches?.firstOrNull() ?: ""
            emitEvent(EVENT_RESULT, Arguments.createMap().apply {
                putString("transcript", transcript)
            })
            // Re-init recognizer for next session (keeps it warm)
            initRecognizer()
        }

        override fun onError(error: Int) {
            isListening = false
            stopAmplitudeSampler()
            val msg = when (error) {
                SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                SpeechRecognizer.ERROR_CLIENT -> "Client side error"
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
                SpeechRecognizer.ERROR_NETWORK -> "Network error"
                SpeechRecognizer.ERROR_NO_MATCH -> "No match"
                SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RecognitionService busy"
                SpeechRecognizer.ERROR_SERVER -> "Server error"
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
                else -> "Unknown error"
            }
            emitError(error, msg)
            initRecognizer()
        }

        override fun onBeginningOfSpeech() {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onEvent(eventType: Int, params: Bundle?) {}
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun emitAmplitude(amplitude: Float) {
        emitEvent(EVENT_AMPLITUDE, Arguments.createMap().apply {
            putDouble("amplitude", amplitude.toDouble())
        })
    }

    private fun emitError(code: Int, message: String) {
        emitEvent(EVENT_ERROR, Arguments.createMap().apply {
            putInt("code", code)
            putString("message", message)
        })
    }

    private fun emitEvent(eventName: String, params: com.facebook.react.bridge.WritableMap) {
        try {
            val app = application as? ReactApplication ?: return
            app.reactNativeHost.reactInstanceManager
                .currentReactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, params)
        } catch (_: Exception) {
            // RN context may not be ready (e.g., triggered from widget before app launch)
        }
    }
}
