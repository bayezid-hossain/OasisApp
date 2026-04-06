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
import com.oasis.app.R

object NotificationHelper {

    const val CHANNEL_RECORDING = "oasis_recording"
    const val CHANNEL_REMINDERS = "oasis_reminders"
    const val CHANNEL_RECAP = "oasis_recap"

    const val NOTIF_ID_RECORDING = 1001
    const val NOTIF_ID_RECAP = 1002

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = context.getSystemService(NotificationManager::class.java)

            nm.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_RECORDING,
                    "Voice Recording",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Active while Oasis is listening"
                    setShowBadge(false)
                }
            )

            nm.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_REMINDERS,
                    "Reminders",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Your scheduled reminders"
                }
            )

            nm.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_RECAP,
                    "Weekly Recap",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Your Sunday thought summary"
                }
            )
        }
    }

    fun buildRecordingNotification(context: Context): Notification {
        val tapIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_RECORDING)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("Oasis is listening…")
            .setContentText("Speak your thought")
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    fun buildReminderNotification(context: Context, label: String, noteId: String): Notification {
        val tapIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("noteId", noteId)
        }
        val pendingIntent = PendingIntent.getActivity(
            context, noteId.hashCode(), tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_REMINDERS)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle("Reminder")
            .setContentText(label)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
    }
}
