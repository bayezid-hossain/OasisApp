package com.oasis.app.modules

import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class HapticsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "HapticsModule"

    private fun vibrator(): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vm = reactApplicationContext.getSystemService(VibratorManager::class.java)
            vm.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            reactApplicationContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    /** Double pulse — recording start */
    @ReactMethod
    fun notificationSuccess() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val pattern = longArrayOf(0, 60, 80, 60)
            vibrator().vibrate(VibrationEffect.createWaveform(pattern, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator().vibrate(longArrayOf(0, 60, 80, 60), -1)
        }
    }

    /** Single firm tap — thought saved */
    @ReactMethod
    fun notificationSave() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator().vibrate(VibrationEffect.createOneShot(80, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator().vibrate(80)
        }
    }

    /** Light tap — UI interaction */
    @ReactMethod
    fun impactLight() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator().vibrate(VibrationEffect.createOneShot(30, 50))
        } else {
            @Suppress("DEPRECATION")
            vibrator().vibrate(30)
        }
    }
}
