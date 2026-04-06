package com.oasis.app.receivers

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.oasis.app.utils.NotificationHelper

class AlarmReceiver : BroadcastReceiver() {

    companion object {
        const val EXTRA_NOTE_ID = "noteId"
        const val EXTRA_LABEL = "label"
        const val EXTRA_REQUEST_CODE = "requestCode"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val noteId = intent.getStringExtra(EXTRA_NOTE_ID) ?: return
        val label = intent.getStringExtra(EXTRA_LABEL) ?: "Reminder"
        val requestCode = intent.getIntExtra(EXTRA_REQUEST_CODE, 0)

        val nm = context.getSystemService(NotificationManager::class.java)
        val notification = NotificationHelper.buildReminderNotification(context, label, noteId)
        nm.notify(requestCode, notification)
    }
}
