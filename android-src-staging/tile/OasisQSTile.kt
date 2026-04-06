package com.oasis.app.tile

import android.content.Intent
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import com.oasis.app.MainActivity
import com.oasis.app.services.VoiceCaptureService

class OasisQSTile : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        qsTile?.apply {
            state = Tile.STATE_INACTIVE
            label = "Oasis"
            contentDescription = "Capture a thought"
            updateTile()
        }
    }

    override fun onClick() {
        super.onClick()
        // 1. Start the voice capture service
        val serviceIntent = Intent(applicationContext, VoiceCaptureService::class.java).apply {
            action = VoiceCaptureService.ACTION_START_LISTENING
        }
        applicationContext.startForegroundService(serviceIntent)

        // 2. Open the app to the CaptureOverlay
        val appIntent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("openCapture", true)
            putExtra("captureMode", "voice")
        }
        startActivityAndCollapse(appIntent)

        qsTile?.apply {
            state = Tile.STATE_ACTIVE
            updateTile()
        }
    }

    override fun onStopListening() {
        super.onStopListening()
        qsTile?.apply {
            state = Tile.STATE_INACTIVE
            updateTile()
        }
    }
}
