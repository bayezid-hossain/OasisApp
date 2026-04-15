package com.oasis.app.ui

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.view.setPadding
import com.oasis.app.classifier.NoteClassifier
import com.oasis.app.database.NoteEntity
import com.oasis.app.database.OasisDatabase
import com.oasis.app.widget.OasisWidgetProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID

/**
 * Lightweight floating overlay for text capture.
 * Launched from the widget "Text" button — appears over the home screen / lock screen
 * with a dimmed background, a text field, and a Save button. Dismisses itself after saving.
 */
class TextCaptureActivity : Activity() {

    private lateinit var input: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show over lock screen without requiring unlock
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        // Dim background, floating dialog style
        window.setBackgroundDrawableResource(android.R.color.transparent)
        window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        window.attributes = window.attributes.apply { dimAmount = 0.6f }
        window.setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE or
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        )

        val root = buildLayout()
        setContentView(root)

        // Show keyboard immediately
        input.post {
            input.requestFocus()
            val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
            imm.showSoftInput(input, InputMethodManager.SHOW_IMPLICIT)
        }

        // Tap outside → dismiss without saving
        root.setOnClickListener { finish() }
    }

    private fun buildLayout(): FrameLayout {
        val dp = resources.displayMetrics.density

        // Card container
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFF1A2222.toInt())
            setPadding((20 * dp).toInt())
            elevation = 24f * dp
            // Prevent tap-through to the dismiss listener on the root
            isClickable = true
        }

        // "Oasis" label
        val label = TextView(this).apply {
            text = "oasis"
            textSize = 11f
            setTextColor(0xFF3ADCCC.toInt())
            letterSpacing = 0.12f
            isSingleLine = true
        }

        // Text input
        input = EditText(this).apply {
            hint = "What's on your mind?"
            setHintTextColor(0x66BFC9C4.toInt())
            setTextColor(0xFFE0E6E4.toInt())
            textSize = 16f
            background = null
            imeOptions = EditorInfo.IME_ACTION_NONE
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE or
                android.text.InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
            minLines = 3
            maxLines = 6
            gravity = Gravity.TOP
            val v = (12 * dp).toInt()
            setPadding(0, v, 0, v)
        }

        // Save button
        val saveBtn = TextView(this).apply {
            text = "Save"
            textSize = 14f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setTextColor(0xFF0D1F1C.toInt())
            setBackgroundColor(0xFF3ADCCC.toInt())
            gravity = Gravity.CENTER
            val hPad = (20 * dp).toInt()
            val vPad = (12 * dp).toInt()
            setPadding(hPad, vPad, hPad, vPad)
            setOnClickListener { saveNote() }
        }

        card.addView(label, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = (12 * dp).toInt() })

        card.addView(input, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = (16 * dp).toInt() })

        card.addView(saveBtn, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ))

        // Root: full-screen transparent, tapping outside dismisses
        val root = FrameLayout(this)
        val margin = (24 * dp).toInt()
        root.addView(card, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER_VERTICAL
        ).apply {
            leftMargin = margin; rightMargin = margin
        })

        return root
    }

    private fun saveNote() {
        val text = input.text.toString().trim()
        if (text.isBlank()) {
            Toast.makeText(this, "Write something first", Toast.LENGTH_SHORT).show()
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            val result = NoteClassifier.classify(text)
            val entity = NoteEntity(
                id          = UUID.randomUUID().toString(),
                text        = text,
                createdAt   = System.currentTimeMillis(),
                type        = result.type,
                inputSource = "text",
                tags        = "",
                confidence  = result.confidence,
            )
            OasisDatabase.getInstance(applicationContext).noteDao().insert(entity)

            // Refresh widget
            sendBroadcast(Intent(OasisWidgetProvider.ACTION_RECORDING_STOPPED).apply {
                setPackage(packageName)
            })

            withContext(Dispatchers.Main) {
                Toast.makeText(applicationContext, "Thought saved", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }
}
