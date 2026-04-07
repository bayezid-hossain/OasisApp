package com.oasis.app.tile

import android.content.Intent
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import com.oasis.app.services.VoiceCaptureService

class OasisQSTile : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        syncTileState()
    }

    override fun onClick() {
        super.onClick()
        if (VoiceCaptureService.isRecording) {
            applicationContext.startService(
                Intent(applicationContext, VoiceCaptureService::class.java).apply {
                    action = VoiceCaptureService.ACTION_STOP_LISTENING
                }
            )
        } else {
            applicationContext.startForegroundService(
                Intent(applicationContext, VoiceCaptureService::class.java).apply {
                    action = VoiceCaptureService.ACTION_START_LISTENING
                }
            )
        }
        syncTileState()
    }

    override fun onStopListening() {
        super.onStopListening()
        syncTileState()
    }

    private fun syncTileState() {
        qsTile?.apply {
            if (VoiceCaptureService.isRecording) {
                state = Tile.STATE_ACTIVE
                label = "Recording…"
                contentDescription = "Tap to stop and save"
            } else {
                state = Tile.STATE_INACTIVE
                label = "Oasis"
                contentDescription = "Tap to capture a thought"
            }
            updateTile()
        }
    }
}
