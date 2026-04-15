package com.oasis.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.oasis.app.utils.NotificationHelper

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // Post the idle notification so the lock screen shortcut is immediately available
            NotificationHelper.createChannels(context)
            NotificationHelper.postIdleNotification(context)
        }
    }
}
