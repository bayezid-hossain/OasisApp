package com.oasis.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.oasis.app.services.VoiceCaptureService

/**
 * Handles action button taps from both the idle and recording notifications.
 * Works on the lock screen — no app open required.
 *
 * ACTION_START  → triggered from idle notification "Record" button
 * ACTION_STOP   → triggered from recording notification "Stop" button
 * ACTION_CANCEL → triggered from recording notification "Cancel" button
 */
class NotificationActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        Log.d("NotifActionReceiver", "onReceive action=${intent.action}")
        val serviceAction = when (intent.action) {
            ACTION_START  -> VoiceCaptureService.ACTION_START_LISTENING
            ACTION_STOP   -> VoiceCaptureService.ACTION_STOP_LISTENING
            ACTION_CANCEL -> VoiceCaptureService.ACTION_CANCEL_LISTENING
            else          -> return
        }
        val svcIntent = Intent(context, VoiceCaptureService::class.java).apply {
            action = serviceAction
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(svcIntent)
            } else {
                context.startService(svcIntent)
            }
            Log.d("NotifActionReceiver", "Started VoiceCaptureService with $serviceAction")
        } catch (e: Exception) {
            Log.e("NotifActionReceiver", "Failed to start VoiceCaptureService", e)
        }
    }

    companion object {
        const val ACTION_START  = "com.oasis.app.NOTIF_ACTION_START"
        const val ACTION_STOP   = "com.oasis.app.NOTIF_ACTION_STOP"
        const val ACTION_CANCEL = "com.oasis.app.NOTIF_ACTION_CANCEL"
    }
}
