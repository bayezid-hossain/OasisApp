const {
  withMainApplication,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
} = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

/**
 * Expo Config Plugin — auto-applies all Oasis native changes on every prebuild:
 *  1. Copies android-src-staging/**  →  android/app/src/main/java/com/oasis/app/
 *  2. Copies android-res/**          →  android/app/src/main/res/
 *  3. Patches MainApplication.kt to register all 4 native packages + NotificationHelper
 *  4. Patches AndroidManifest.xml: permissions, services, receivers, QS tile, widget
 *  5. Patches app/build.gradle: kapt, Room, WorkManager, Coroutines, ProGuard
 *  6. Writes proguard-rules.pro keep rules
 *  7. Pins Gradle wrapper to 8.14.3 (matches Expo 54 + RN 0.81.x — known-good)
 *
 * `expo prebuild --clean` is fully safe — everything is restored automatically.
 */
const withOasisModule = (config) => {
  config = withStagingFiles(config)
  config = withOasisResFiles(config)
  config = withOasisMainApplication(config)
  config = withOasisManifest(config)
  config = withOasisBuildGradle(config)
  config = withOasisProguard(config)
  config = withGradleWrapper(config)
  return config
}

// ── 1. Copy android-src-staging → android/app/src/main/java/com/oasis/app/ ──

const withStagingFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const stagingDir = path.join(__dirname, '..', 'android-src-staging')
      const destBase = path.join(
        mod.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'java', 'com', 'oasis', 'app'
      )

      function copyDir(src, dest) {
        fs.mkdirSync(dest, { recursive: true })
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const srcPath = path.join(src, entry.name)
          const destPath = path.join(dest, entry.name)
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath)
          } else {
            fs.copyFileSync(srcPath, destPath)
            console.log(`[withOasisModule] Copied ${entry.name}`)
          }
        }
      }

      if (fs.existsSync(stagingDir)) {
        copyDir(stagingDir, destBase)
      } else {
        console.warn(`[withOasisModule] android-src-staging not found at ${stagingDir}`)
      }

      return mod
    },
  ])
}

// ── 2. Copy android-res → android/app/src/main/res/ ──────────────────────────

const withOasisResFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const resSource = path.join(__dirname, '..', 'android-res')
      const resDest = path.join(
        mod.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res'
      )

      function copyDir(src, dest) {
        fs.mkdirSync(dest, { recursive: true })
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const srcPath = path.join(src, entry.name)
          const destPath = path.join(dest, entry.name)
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath)
          } else {
            fs.copyFileSync(srcPath, destPath)
            console.log(`[withOasisModule] Copied res/${path.relative(resSource, srcPath)}`)
          }
        }
      }

      if (fs.existsSync(resSource)) {
        copyDir(resSource, resDest)
      } else {
        console.warn(`[withOasisModule] android-res not found at ${resSource}`)
      }

      return mod
    },
  ])
}

// ── 3. Patch MainApplication.kt ───────────────────────────────────────────────

const withOasisMainApplication = (config) => {
  return withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents

    // Imports
    const imports = [
      'import com.oasis.app.modules.SpeechPackage',
      'import com.oasis.app.modules.StoragePackage',
      'import com.oasis.app.modules.HapticsPackage',
      'import com.oasis.app.modules.AlarmPackage',
      'import com.oasis.app.utils.NotificationHelper',
    ]
    for (const imp of imports) {
      if (!contents.includes(imp)) {
        contents = contents.replace(
          'import com.facebook.react.PackageList',
          `import com.facebook.react.PackageList\n${imp}`
        )
      }
    }

    // Register packages in getPackages()
    const packages = [
      'add(SpeechPackage())',
      'add(StoragePackage())',
      'add(HapticsPackage())',
      'add(AlarmPackage())',
    ]
    for (const pkg of packages) {
      if (!contents.includes(pkg)) {
        contents = contents.replace(
          'PackageList(this).packages.apply {',
          `PackageList(this).packages.apply {\n              ${pkg}`
        )
      }
    }

    // Call NotificationHelper.createChannels in onCreate()
    const channelCall = 'NotificationHelper.createChannels(this)'
    if (!contents.includes(channelCall)) {
      contents = contents.replace(
        'super.onCreate()',
        `super.onCreate()\n    ${channelCall}`
      )
    }

    mod.modResults.contents = contents
    return mod
  })
}

// ── 4. Patch AndroidManifest.xml ─────────────────────────────────────────────

const withOasisManifest = (config) => {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest
    const app = manifest.application[0]

    // Permissions
    if (!manifest['uses-permission']) manifest['uses-permission'] = []
    const requiredPerms = [
      'android.permission.RECORD_AUDIO',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MICROPHONE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.VIBRATE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
    ]
    for (const perm of requiredPerms) {
      const exists = manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === perm
      )
      if (!exists) {
        manifest['uses-permission'].push({ $: { 'android:name': perm } })
      }
    }

    if (!app.service) app.service = []
    if (!app.receiver) app.receiver = []

    const hasService = (name) => app.service.some((s) => s.$?.['android:name'] === name)
    const hasReceiver = (name) => app.receiver.some((r) => r.$?.['android:name'] === name)

    // VoiceCaptureService
    if (!hasService('com.oasis.app.services.VoiceCaptureService')) {
      app.service.push({
        $: {
          'android:name': 'com.oasis.app.services.VoiceCaptureService',
          'android:foregroundServiceType': 'microphone',
          'android:exported': 'false',
        },
      })
    }

    // Quick Settings Tile
    if (!hasService('com.oasis.app.tile.OasisQSTile')) {
      app.service.push({
        $: {
          'android:name': 'com.oasis.app.tile.OasisQSTile',
          'android:label': 'Oasis',
          'android:icon': '@mipmap/ic_launcher',
          'android:permission': 'android.permission.BIND_QUICK_SETTINGS_TILE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.service.quicksettings.action.QS_TILE' } },
            ],
          },
        ],
      })
    }

    // BootReceiver
    if (!hasReceiver('com.oasis.app.receivers.BootReceiver')) {
      app.receiver.push({
        $: {
          'android:name': 'com.oasis.app.receivers.BootReceiver',
          'android:enabled': 'true',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
            ],
          },
        ],
      })
    }

    // AlarmReceiver
    if (!hasReceiver('com.oasis.app.receivers.AlarmReceiver')) {
      app.receiver.push({
        $: {
          'android:name': 'com.oasis.app.receivers.AlarmReceiver',
          'android:exported': 'false',
        },
      })
    }

    // NotificationActionReceiver — handles Stop/Cancel from lock-screen notification
    if (!hasReceiver('com.oasis.app.receivers.NotificationActionReceiver')) {
      app.receiver.push({
        $: {
          'android:name': 'com.oasis.app.receivers.NotificationActionReceiver',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'com.oasis.app.NOTIF_ACTION_STOP' } },
              { $: { 'android:name': 'com.oasis.app.NOTIF_ACTION_CANCEL' } },
            ],
          },
        ],
      })
    }

    // 4x2 Widget
    if (!hasReceiver('com.oasis.app.widget.OasisWidgetProvider')) {
      app.receiver.push({
        $: {
          'android:name': 'com.oasis.app.widget.OasisWidgetProvider',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/appwidget_info',
            },
          },
        ],
      })
    }

    return mod
  })
}

// ── 5. Patch app/build.gradle ─────────────────────────────────────────────────

const withOasisBuildGradle = (config) => {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents

    // Add kapt plugin
    if (!gradle.includes('org.jetbrains.kotlin.kapt')) {
      gradle = gradle.replace(
        /apply plugin: ["']org\.jetbrains\.kotlin\.android["']/,
        `apply plugin: "org.jetbrains.kotlin.android"\napply plugin: "org.jetbrains.kotlin.kapt"`
      )
    }

    // minSdkVersion 26
    gradle = gradle.replace(/minSdkVersion\s+\d+/, 'minSdkVersion 26')

    // Oasis dependencies
    if (!gradle.includes('androidx.room:room-runtime')) {
      gradle = gradle.replace(
        'dependencies {',
        `dependencies {
    // Room 2.7.0 — bundles kotlinx-metadata-jvm 0.9.0 which supports Kotlin 2.1.x metadata
    implementation "androidx.room:room-runtime:2.7.0"
    implementation "androidx.room:room-ktx:2.7.0"
    kapt "androidx.room:room-compiler:2.7.0"
    // WorkManager
    implementation "androidx.work:work-runtime-ktx:2.9.0"
    // Coroutines
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1"
    // Core KTX
    implementation "androidx.core:core-ktx:1.13.1"`
      )
    }

    // Enable ProGuard in release
    if (gradle.includes('def enableProguardInReleaseBuilds = false')) {
      gradle = gradle.replace(
        'def enableProguardInReleaseBuilds = false',
        'def enableProguardInReleaseBuilds = true'
      )
    }

    mod.modResults.contents = gradle
    return mod
  })
}

// ── 6. Write proguard-rules.pro ───────────────────────────────────────────────

const PROGUARD_RULES = `
# ── Oasis keep rules ──────────────────────────────────────────────────────────
-keep class com.oasis.app.** { *; }

# Kotlin metadata
-keepattributes *Annotation*, Signature, Exception, EnclosingMethod, InnerClasses

# React Native bridge
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
`

const withOasisProguard = (config) => {
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const proguardPath = path.join(
        mod.modRequest.platformProjectRoot,
        'app', 'proguard-rules.pro'
      )
      let existing = fs.existsSync(proguardPath)
        ? fs.readFileSync(proguardPath, 'utf8')
        : ''
      if (!existing.includes('Oasis keep rules')) {
        fs.writeFileSync(proguardPath, existing + PROGUARD_RULES, 'utf8')
      }
      return mod
    },
  ])
}

// ── 7. Pin Gradle wrapper to 8.14.3 ──────────────────────────────────────────
// Matches SecureSMS (Expo 54 + RN 0.81.5) — a known-good configuration.

const GRADLE_VERSION = '8.14.3'

const withGradleWrapper = (config) => {
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const wrapperPath = path.join(
        mod.modRequest.platformProjectRoot,
        'gradle', 'wrapper', 'gradle-wrapper.properties'
      )
      if (fs.existsSync(wrapperPath)) {
        let contents = fs.readFileSync(wrapperPath, 'utf8')
        contents = contents.replace(
          /distributionUrl=.*gradle-.*\.zip/,
          `distributionUrl=https\\://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip`
        )
        fs.writeFileSync(wrapperPath, contents, 'utf8')
        console.log(`[withOasisModule] Pinned Gradle to ${GRADLE_VERSION}`)
      }
      return mod
    },
  ])
}

module.exports = withOasisModule
