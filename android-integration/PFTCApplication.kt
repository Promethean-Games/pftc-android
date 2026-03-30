package com.prometheangames.pftc.classic

import android.app.Application
import com.google.android.gms.games.PlayGamesSdk

/**
 * Custom Application class required by Play Games Services v2.
 *
 * PlayGamesSdk.initialize() must be called here (Application.onCreate),
 * NOT in an Activity — the official guide is explicit about this.
 *
 * Register this class in AndroidManifest.xml:
 *
 *   <application
 *       android:name=".PFTCApplication"
 *       ... >
 */
class PFTCApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        PlayGamesSdk.initialize(this)
    }
}
