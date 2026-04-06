package com.oasis.app.modules

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*
import com.oasis.app.receivers.AlarmReceiver
import java.util.Calendar

class AlarmModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AlarmModule"

    private val alarmManager: AlarmManager
        get() = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    @ReactMethod
    fun scheduleReminder(noteId: String, epochMillis: Double, label: String, promise: Promise) {
        try {
            val requestCode = noteId.hashCode() and 0x7FFFFFFF // positive int

            val intent = Intent(reactApplicationContext, AlarmReceiver::class.java).apply {
                putExtra(AlarmReceiver.EXTRA_NOTE_ID, noteId)
                putExtra(AlarmReceiver.EXTRA_LABEL, label)
                putExtra(AlarmReceiver.EXTRA_REQUEST_CODE, requestCode)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                reactApplicationContext,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            val triggerAt = epochMillis.toLong()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAlarmClock(
                    AlarmManager.AlarmClockInfo(triggerAt, pendingIntent),
                    pendingIntent,
                )
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }

            val result = Arguments.createMap()
            result.putInt("requestCode", requestCode)
            promise.resolve(result)
        } catch (e: Exception) {
            // Fallback: setAndAllowWhileIdle (less precise, always works)
            try {
                val requestCode = noteId.hashCode() and 0x7FFFFFFF
                val intent = Intent(reactApplicationContext, AlarmReceiver::class.java).apply {
                    putExtra(AlarmReceiver.EXTRA_NOTE_ID, noteId)
                    putExtra(AlarmReceiver.EXTRA_LABEL, label)
                    putExtra(AlarmReceiver.EXTRA_REQUEST_CODE, requestCode)
                }
                val pendingIntent = PendingIntent.getBroadcast(
                    reactApplicationContext,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                )
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP, epochMillis.toLong(), pendingIntent
                )
                val result = Arguments.createMap()
                result.putInt("requestCode", requestCode)
                promise.resolve(result)
            } catch (e2: Exception) {
                promise.reject("ALARM_ERROR", e2.message, e2)
            }
        }
    }

    @ReactMethod
    fun cancelReminder(requestCode: Int, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, AlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                reactApplicationContext,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
            )
            pendingIntent?.let { alarmManager.cancel(it) }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun scheduleWeeklyRecap(promise: Promise) {
        try {
            val requestCode = 9999
            val intent = Intent(reactApplicationContext, AlarmReceiver::class.java).apply {
                putExtra(AlarmReceiver.EXTRA_NOTE_ID, "weekly_recap")
                putExtra(AlarmReceiver.EXTRA_LABEL, "Your weekly thought summary is ready")
                putExtra(AlarmReceiver.EXTRA_REQUEST_CODE, requestCode)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                reactApplicationContext,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            // Next Sunday at 9:00 AM
            val cal = Calendar.getInstance().apply {
                set(Calendar.DAY_OF_WEEK, Calendar.SUNDAY)
                set(Calendar.HOUR_OF_DAY, 9)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                if (timeInMillis <= System.currentTimeMillis()) add(Calendar.WEEK_OF_YEAR, 1)
            }

            alarmManager.setRepeating(
                AlarmManager.RTC_WAKEUP,
                cal.timeInMillis,
                AlarmManager.INTERVAL_DAY * 7,
                pendingIntent,
            )
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RECAP_ALARM_ERROR", e.message, e)
        }
    }
}
