package com.prometheangames.pftc.classic

import android.webkit.JavascriptInterface
import com.google.android.gms.games.PlayGames
import java.lang.ref.WeakReference

class PlayGamesInterface(activity: WebViewActivity) {

    private val activityRef = WeakReference(activity)

    @JavascriptInterface
    fun unlockAchievement(achievementId: String) {
        activityRef.get()?.let { activity ->
            PlayGames.getAchievementsClient(activity).unlock(achievementId)
        }
    }

    @JavascriptInterface
    fun incrementAchievement(achievementId: String, steps: Int) {
        activityRef.get()?.let { activity ->
            PlayGames.getAchievementsClient(activity).increment(achievementId, steps)
        }
    }
}
