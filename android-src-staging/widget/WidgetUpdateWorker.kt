package com.oasis.app.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.oasis.app.R
import com.oasis.app.database.OasisDatabase
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WidgetUpdateWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val dao = OasisDatabase.getInstance(applicationContext).noteDao()
            val latest = dao.getLatest()

            val manager = AppWidgetManager.getInstance(applicationContext)
            val ids = manager.getAppWidgetIds(
                ComponentName(applicationContext, OasisWidgetProvider::class.java)
            )

            val views = RemoteViews(applicationContext.packageName, R.layout.widget_oasis_4x2)

            if (latest != null) {
                views.setTextViewText(R.id.widget_thought_text, latest.text)
                val timeAgo = formatTimeAgo(latest.createdAt)
                views.setTextViewText(R.id.widget_timestamp, timeAgo)
            }

            // Wire mic button → VoiceCaptureService
            OasisWidgetProvider.applyIntents(applicationContext, views)

            ids.forEach { id -> manager.updateAppWidget(id, views) }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    private fun formatTimeAgo(epochMs: Long): String {
        val diff = System.currentTimeMillis() - epochMs
        val mins = diff / 60000
        val hours = mins / 60
        val days = hours / 24
        return when {
            mins < 1 -> "just now"
            mins < 60 -> "${mins}m ago"
            hours < 24 -> "${hours}h ago"
            days == 1L -> "yesterday"
            else -> SimpleDateFormat("MMM d", Locale.getDefault()).format(Date(epochMs))
        }
    }
}
