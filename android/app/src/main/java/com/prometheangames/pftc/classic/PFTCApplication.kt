package com.prometheangames.pftc.classic

import android.app.Application
import com.google.android.gms.games.PlayGamesSdk

class PFTCApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        PlayGamesSdk.initialize(this)
    }
}
