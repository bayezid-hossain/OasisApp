package com.oasis.app

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "OasisApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleIntent(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    intent?.let { handleIntent(it) }
  }

  private fun handleIntent(intent: Intent) {
    // Deep-link from QS Tile or widget — open CaptureOverlay
    if (intent.getBooleanExtra("openCapture", false)) {
      val mode = intent.getStringExtra("captureMode") ?: "voice"
      emitEvent("onOpenCapture", Arguments.createMap().apply {
        putString("mode", mode)
      })
    }

    // Deep-link from reminder notification — open ThoughtDetail
    val noteId = intent.getStringExtra("noteId")
    if (noteId != null) {
      emitEvent("onOpenNote", Arguments.createMap().apply {
        putString("noteId", noteId)
      })
    }
  }

  private fun emitEvent(name: String, params: com.facebook.react.bridge.WritableMap) {
    try {
      reactInstanceManager?.currentReactContext
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit(name, params)
    } catch (_: Exception) {
      // Context not ready yet — JS side can read from intent on first load
    }
  }
}
