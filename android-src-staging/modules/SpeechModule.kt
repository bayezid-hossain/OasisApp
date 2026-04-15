package com.oasis.app.modules

import android.content.Intent
import com.facebook.react.bridge.*
import com.oasis.app.services.VoiceCaptureService

class SpeechModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SpeechModule"

    /**
     * Start listening. Optional language = BCP-47 code e.g. "en-US", "es-ES", "bn-BD".
     * Omit or pass null to use the device default language.
     */
    @ReactMethod
    fun startListening(language: String?, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, VoiceCaptureService::class.java).apply {
                action = VoiceCaptureService.ACTION_START_LISTENING
                if (!language.isNullOrBlank()) {
                    putExtra(VoiceCaptureService.EXTRA_LANGUAGE, language)
                }
            }
            reactApplicationContext.startForegroundService(intent)
            val result = Arguments.createMap()
            result.putString("sessionId", System.currentTimeMillis().toString())
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, VoiceCaptureService::class.java).apply {
                action = VoiceCaptureService.ACTION_STOP_LISTENING
            }
            reactApplicationContext.startService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelListening() {
        val intent = Intent(reactApplicationContext, VoiceCaptureService::class.java).apply {
            action = VoiceCaptureService.ACTION_CANCEL_LISTENING
        }
        reactApplicationContext.startService(intent)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
