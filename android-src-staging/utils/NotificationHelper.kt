package com.oasis.app.utils

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.oasis.app.MainActivity
import com.oasis.app.services.IdlePersistService
import com.oasis.app.services.VoiceCaptureService

object NotificationHelper {

    const val CHANNEL_IDLE      = "oasis_idle"
    const val CHANNEL_RECORDING = "oasis_recording"
    const val CHANNEL_REMINDERS = "oasis_reminders"
    const val CHANNEL_RECAP     = "oasis_recap"
    const val CHANNEL_SAVED     = "oasis_saved"

    const val NOTIF_ID_IDLE      = 1000
    const val NOTIF_ID_RECORDING = 1001
    const val NOTIF_ID_RECAP     = 1002
    const val NOTIF_ID_SAVED     = 1003

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = context.getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_IDLE, "Oasis Quick Capture",
                    NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "Always-on lock screen shortcut to capture a thought"
                    setShowBadge(false)
                    setSound(null, null)
                    enableVibration(false)
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                }
            )
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_RECORDING, "Voice Recording",
                    NotificationManager.IMPORTANCE_LOW).apply {
                    description = "Active while Oasis is listening"
                    setShowBadge(false)
                }
            )
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_REMINDERS, "Reminders",
                    NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Your scheduled reminders"
                }
            )
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_RECAP, "Weekly Recap",
                    NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "Your Sunday thought summary"
                }
            )
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_SAVED, "Saved Thoughts",
                    NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "Confirmation when a thought is saved"
                    setShowBadge(false)
                }
            )
        }
    }

    // ── Idle notification — always on lock screen, "tap to record" ────────────

    fun buildIdleNotification(context: Context, lastNote: String? = null): Notification {
        // Use PendingIntent.getForegroundService — directly starts the service
        // without going through BroadcastReceiver. This is the ONLY reliable way
        // on Android 12+ to start a foreground service from a notification action
        // when the app is in the background or screen is locked.
        val recordIntent = PendingIntent.getForegroundService(
            context, 11,
            Intent(context, VoiceCaptureService::class.java).apply {
                action = VoiceCaptureService.ACTION_START_LISTENING
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val openAppIntent = PendingIntent.getActivity(
            context, 10,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val body = if (!lastNote.isNullOrBlank())
            "Last: ${lastNote.take(60)}"
        else
            "Tap to capture a thought"

        return NotificationCompat.Builder(context, CHANNEL_IDLE)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("Oasis")
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(recordIntent)      // tap body → start recording
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(android.R.drawable.ic_btn_speak_now, "Record", recordIntent)
            .build()
    }

    fun postIdleNotification(context: Context) {
        IdlePersistService.start(context)
    }

    fun cancelIdleNotification(context: Context) {
        IdlePersistService.stop(context)
    }

    // ── Recording notification — foreground, shown while VoiceCaptureService is active ──

    fun buildRecordingNotification(context: Context): Notification {
        // Stop & Cancel go directly to the service via getForegroundService
        val stopIntent = PendingIntent.getForegroundService(
            context, 1,
            Intent(context, VoiceCaptureService::class.java).apply {
                action = VoiceCaptureService.ACTION_STOP_LISTENING
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val cancelIntent = PendingIntent.getForegroundService(
            context, 2,
            Intent(context, VoiceCaptureService::class.java).apply {
                action = VoiceCaptureService.ACTION_CANCEL_LISTENING
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_RECORDING)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("Oasis is listening…")
            .setContentText("Tap to stop & save")
            .setContentIntent(stopIntent)     // tap body = stop recording
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(android.R.drawable.ic_media_pause, "Stop & Save", stopIntent)
            .addAction(android.R.drawable.ic_delete, "Cancel", cancelIntent)
            .build()
    }

    fun buildSavedNotification(context: Context, preview: String): Notification {
        val openAppIntent = PendingIntent.getActivity(
            context, 0,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(context, CHANNEL_SAVED)
            .setSmallIcon(android.R.drawable.ic_input_add)
            .setContentTitle("Thought saved")
            .setContentText(preview.take(80))
            .setContentIntent(openAppIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }

    fun buildReminderNotification(context: Context, label: String, noteId: String): Notification {
        val tapIntent = PendingIntent.getActivity(
            context, noteId.hashCode(),
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("noteId", noteId)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(context, CHANNEL_REMINDERS)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle("Reminder")
            .setContentText(label)
            .setContentIntent(tapIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
    }
}
