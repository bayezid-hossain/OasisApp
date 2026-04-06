package com.oasis.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.oasis.app.services.VoiceCaptureService

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // Re-start the foreground service so the SpeechRecognizer is pre-warmed
            val serviceIntent = Intent(context, VoiceCaptureService::class.java)
            context.startForegroundService(serviceIntent)
        }
    }
}
