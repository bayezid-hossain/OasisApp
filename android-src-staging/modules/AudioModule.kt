package com.oasis.app.modules

import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Native audio playback module for recorded voice notes.
 * Exposes play/pause/stop/seek to React Native.
 * Emits onAudioProgress { position, duration } every 250ms while playing.
 * Emits onAudioEnd when playback completes.
 */
class AudioModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var mediaPlayer: MediaPlayer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null

    override fun getName(): String = "AudioModule"

    @ReactMethod
    fun playAudio(path: String, promise: Promise) {
        mainHandler.post {
            try {
                mediaPlayer?.release()
                mediaPlayer = MediaPlayer().apply {
                    setDataSource(path)
                    prepare()
                    start()
                    setOnCompletionListener {
                        stopProgressUpdates()
                        emitEvent("onAudioEnd", Arguments.createMap())
                    }
                }
                startProgressUpdates()
                val result = Arguments.createMap().apply {
                    putInt("duration", mediaPlayer?.duration ?: 0)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("PLAY_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun pauseAudio(promise: Promise) {
        mainHandler.post {
            try {
                mediaPlayer?.takeIf { it.isPlaying }?.pause()
                stopProgressUpdates()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("PAUSE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun resumeAudio(promise: Promise) {
        mainHandler.post {
            try {
                mediaPlayer?.takeIf { !it.isPlaying }?.start()
                startProgressUpdates()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("RESUME_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun stopAudio(promise: Promise) {
        mainHandler.post {
            try {
                stopProgressUpdates()
                mediaPlayer?.apply { stop(); release() }
                mediaPlayer = null
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("STOP_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun seekTo(positionMs: Int, promise: Promise) {
        mainHandler.post {
            try {
                mediaPlayer?.seekTo(positionMs)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("SEEK_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getAudioInfo(path: String, promise: Promise) {
        try {
            val mp = MediaPlayer().apply {
                setDataSource(path)
                prepare()
            }
            val result = Arguments.createMap().apply {
                putInt("duration", mp.duration)
            }
            mp.release()
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("INFO_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun startProgressUpdates() {
        stopProgressUpdates()
        progressRunnable = object : Runnable {
            override fun run() {
                val mp = mediaPlayer ?: return
                if (!mp.isPlaying) return
                emitEvent("onAudioProgress", Arguments.createMap().apply {
                    putInt("position", mp.currentPosition)
                    putInt("duration", mp.duration)
                })
                mainHandler.postDelayed(this, 250)
            }
        }
        mainHandler.postDelayed(progressRunnable!!, 250)
    }

    private fun stopProgressUpdates() {
        progressRunnable?.let { mainHandler.removeCallbacks(it) }
        progressRunnable = null
    }

    private fun emitEvent(name: String, params: WritableMap) {
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(name, params)
        } catch (_: Exception) {}
    }

    override fun onCatalystInstanceDestroy() {
        stopProgressUpdates()
        mediaPlayer?.release()
        mediaPlayer = null
    }
}
