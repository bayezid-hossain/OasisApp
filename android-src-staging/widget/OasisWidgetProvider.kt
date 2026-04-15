package com.oasis.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import com.oasis.app.MainActivity
import com.oasis.app.R
import com.oasis.app.database.OasisDatabase
import com.oasis.app.receivers.NotificationActionReceiver
import com.oasis.app.services.VoiceCaptureService
import com.oasis.app.ui.TextCaptureActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class OasisWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        // Show idle state immediately — never blank
        for (id in appWidgetIds) {
            appWidgetManager.updateAppWidget(id, buildIdleViews(context, null, null))
        }
        // Then fetch latest note in background
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val latest = OasisDatabase.getInstance(context).noteDao().getLatest()
                for (id in appWidgetIds) {
                    appWidgetManager.updateAppWidget(
                        id, buildIdleViews(context, latest?.text, latest?.createdAt)
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Widget DB fetch failed: ${e.message}")
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(
            android.content.ComponentName(context, OasisWidgetProvider::class.java)
        )
        when (intent.action) {
            ACTION_RECORDING_STARTED -> {
                val startTime = intent.getLongExtra(EXTRA_START_TIME, SystemClock.elapsedRealtime())
                for (id in ids) {
                    manager.updateAppWidget(id, buildRecordingViews(context, startTime))
                }
            }
            ACTION_RECORDING_STOPPED -> {
                for (id in ids) {
                    manager.updateAppWidget(id, buildIdleViews(context, null, null))
                }
                // Refresh note list in background
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val latest = OasisDatabase.getInstance(context).noteDao().getLatest()
                        for (id in ids) {
                            manager.updateAppWidget(
                                id, buildIdleViews(context, latest?.text, latest?.createdAt)
                            )
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Widget refresh after stop failed: ${e.message}")
                    }
                }
            }
        }
    }

    companion object {
        private const val TAG = "OasisWidgetProvider"

        const val ACTION_RECORDING_STARTED = "com.oasis.app.WIDGET_RECORDING_STARTED"
        const val ACTION_RECORDING_STOPPED  = "com.oasis.app.WIDGET_RECORDING_STOPPED"
        const val EXTRA_START_TIME          = "start_time"

        private fun buildIdleViews(
            context: Context,
            noteText: String?,
            noteTime: Long?,
        ): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_oasis_4x2)

            views.setViewVisibility(R.id.widget_thought_text, View.VISIBLE)
            views.setViewVisibility(R.id.widget_btn_record,   View.VISIBLE)
            views.setViewVisibility(R.id.widget_btn_text,     View.VISIBLE)
            views.setViewVisibility(R.id.widget_chronometer,  View.GONE)
            views.setViewVisibility(R.id.widget_btn_cancel,   View.GONE)

            views.setTextViewText(
                R.id.widget_thought_text,
                noteText?.takeIf { it.isNotBlank() }
                    ?: "Your mind is clear.\nTap to capture a thought."
            )
            views.setTextViewText(
                R.id.widget_timestamp,
                noteTime?.let { formatTimeAgo(it) } ?: "--"
            )

            applyIdleIntents(context, views)
            return views
        }

        private fun buildRecordingViews(context: Context, startTime: Long): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_oasis_4x2)

            views.setViewVisibility(R.id.widget_thought_text, View.GONE)
            views.setViewVisibility(R.id.widget_btn_record,   View.GONE)
            views.setViewVisibility(R.id.widget_btn_text,     View.GONE)
            views.setViewVisibility(R.id.widget_chronometer,  View.VISIBLE)
            views.setViewVisibility(R.id.widget_btn_cancel,   View.VISIBLE)

            views.setChronometer(R.id.widget_chronometer, startTime, null, true)

            // Cancel in widget = Stop & Save (not discard)
            val stopIntent = PendingIntent.getBroadcast(
                context, 2001,
                Intent(context, NotificationActionReceiver::class.java).apply {
                    action = NotificationActionReceiver.ACTION_STOP
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(R.id.widget_btn_cancel, stopIntent)

            return views
        }

        private fun applyIdleIntents(context: Context, views: RemoteViews) {
            val recordIntent = PendingIntent.getService(
                context, 1001,
                Intent(context, VoiceCaptureService::class.java).apply {
                    action = VoiceCaptureService.ACTION_START_LISTENING
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            // Text button → floating overlay input (no app navigation)
            val textIntent = PendingIntent.getActivity(
                context, 1003,
                Intent(context, TextCaptureActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            val appIntent = PendingIntent.getActivity(
                context, 1002,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(R.id.widget_btn_record,   recordIntent)
            views.setOnClickPendingIntent(R.id.widget_btn_text,     textIntent)
            views.setOnClickPendingIntent(R.id.widget_thought_text, appIntent)
        }

        private fun formatTimeAgo(epochMs: Long): String {
            val diff = System.currentTimeMillis() - epochMs
            val mins = diff / 60000
            val hours = mins / 60
            val days = hours / 24
            return when {
                mins < 1   -> "just now"
                mins < 60  -> "${mins}m ago"
                hours < 24 -> "${hours}h ago"
                days == 1L -> "yesterday"
                else -> SimpleDateFormat("MMM d", Locale.getDefault()).format(Date(epochMs))
            }
        }
    }
}
