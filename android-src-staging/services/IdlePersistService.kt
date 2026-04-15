package com.oasis.app.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import com.oasis.app.utils.NotificationHelper

/**
 * Minimal foreground service whose sole purpose is to keep the "Oasis Quick
 * Capture" idle notification pinned and non-dismissable — exactly like a
 * foreground service notification.
 *
 * When VoiceCaptureService starts recording it cancels this service (which
 * replaces the idle notif with the recording one). When recording finishes,
 * this service is restarted so the idle notif comes back.
 */
class IdlePersistService : Service() {

    companion object {
        private const val TAG = "IdlePersistService"

        fun start(context: Context) {
            val intent = Intent(context, IdlePersistService::class.java)
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start IdlePersistService", e)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, IdlePersistService::class.java))
        }
    }

    override fun onCreate() {
        super.onCreate()
        try {
            startForeground(
                NotificationHelper.NOTIF_ID_IDLE,
                NotificationHelper.buildIdleNotification(this)
            )
        } catch (e: Exception) {
            Log.e(TAG, "startForeground failed", e)
            stopSelf()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Re-post the notification in case content changed (e.g. last note updated)
        val nm = getSystemService(android.app.NotificationManager::class.java)
        nm.notify(NotificationHelper.NOTIF_ID_IDLE, NotificationHelper.buildIdleNotification(this))
        return START_STICKY   // Auto-restart if killed
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "IdlePersistService destroyed")
    }
}
