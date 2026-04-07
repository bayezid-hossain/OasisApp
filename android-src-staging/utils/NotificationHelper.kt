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
import com.oasis.app.receivers.NotificationActionReceiver

object NotificationHelper {

    const val CHANNEL_RECORDING = "oasis_recording"
    const val CHANNEL_REMINDERS = "oasis_reminders"
    const val CHANNEL_RECAP     = "oasis_recap"
    const val CHANNEL_SAVED     = "oasis_saved"

    const val NOTIF_ID_RECORDING = 1001
    const val NOTIF_ID_RECAP     = 1002
    const val NOTIF_ID_SAVED     = 1003

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = context.getSystemService(NotificationManager::class.java)
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

    /**
     * Recording notification — shown while VoiceCaptureService is active.
     * Stop + Cancel buttons work from the lock screen without unlocking.
     * VISIBILITY_PUBLIC ensures buttons show on lock screen.
     */
    fun buildRecordingNotification(context: Context): Notification {
        val openAppIntent = PendingIntent.getActivity(
            context, 0,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("openCapture", true)
                putExtra("captureMode", "voice")
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = PendingIntent.getBroadcast(
            context, 1,
            Intent(context, NotificationActionReceiver::class.java).apply {
                action = NotificationActionReceiver.ACTION_STOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val cancelIntent = PendingIntent.getBroadcast(
            context, 2,
            Intent(context, NotificationActionReceiver::class.java).apply {
                action = NotificationActionReceiver.ACTION_CANCEL
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_RECORDING)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("Oasis is listening…")
            .setContentText("Tap Stop to save  ·  Cancel to discard")
            .setContentIntent(openAppIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(android.R.drawable.ic_media_pause, "Stop", stopIntent)
            .addAction(android.R.drawable.ic_delete,      "Cancel", cancelIntent)
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
