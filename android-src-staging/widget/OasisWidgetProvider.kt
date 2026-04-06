package com.oasis.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.oasis.app.MainActivity
import com.oasis.app.R
import com.oasis.app.services.VoiceCaptureService

class OasisWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        // Enqueue a WorkManager job to fetch latest note off the main thread
        WorkManager.getInstance(context).enqueueUniqueWork(
            "widget_update",
            ExistingWorkPolicy.REPLACE,
            OneTimeWorkRequestBuilder<WidgetUpdateWorker>().build(),
        )
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        // Immediately show something when widget is first added
        onUpdate(context, AppWidgetManager.getInstance(context),
            AppWidgetManager.getInstance(context).getAppWidgetIds(
                android.content.ComponentName(context, OasisWidgetProvider::class.java)
            )
        )
    }

    companion object {
        fun applyIntents(context: Context, views: RemoteViews) {
            // Mic button → start VoiceCaptureService + launch app
            val recordIntent = Intent(context, VoiceCaptureService::class.java).apply {
                action = VoiceCaptureService.ACTION_START_LISTENING
            }
            val recordPendingIntent = PendingIntent.getService(
                context, 1001, recordIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            val appIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("openCapture", true)
                putExtra("captureMode", "voice")
            }
            val appPendingIntent = PendingIntent.getActivity(
                context, 1002, appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            views.setOnClickPendingIntent(R.id.widget_btn_record, recordPendingIntent)

            // Complete button → open app to that note
            val completeIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("openCapture", false)
            }
            val completePendingIntent = PendingIntent.getActivity(
                context, 1003, completeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(R.id.widget_btn_complete, completePendingIntent)

            // Tap text → open app
            views.setOnClickPendingIntent(R.id.widget_thought_text, appPendingIntent)
        }
    }
}
