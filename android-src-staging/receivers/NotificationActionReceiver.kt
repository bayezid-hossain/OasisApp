package com.oasis.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.oasis.app.services.VoiceCaptureService

/**
 * Receives action button taps from the recording foreground notification.
 * Works on the lock screen — no app open required.
 */
class NotificationActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = when (intent.action) {
            ACTION_STOP   -> VoiceCaptureService.ACTION_STOP_LISTENING
            ACTION_CANCEL -> VoiceCaptureService.ACTION_CANCEL_LISTENING
            else          -> return
        }
        context.startService(
            Intent(context, VoiceCaptureService::class.java).apply {
                this.action = action
            }
        )
    }

    companion object {
        const val ACTION_STOP   = "com.oasis.app.NOTIF_ACTION_STOP"
        const val ACTION_CANCEL = "com.oasis.app.NOTIF_ACTION_CANCEL"
    }
}
