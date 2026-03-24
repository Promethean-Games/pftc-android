package com.prometheangames.pftc.classic

import android.webkit.JavascriptInterface
import com.google.android.gms.games.PlayGames
import java.lang.ref.WeakReference

/**
 * Exposes Google Play Games Services to the web app as window.PlayGames.
 *
 * The web layer calls:
 *   window.PlayGames.unlockAchievement(achievementId)
 *   window.PlayGames.incrementAchievement(achievementId, steps)
 *
 * These methods are called from a background thread by the WebView —
 * PGPS client calls are thread-safe, so no runOnUiThread() is required.
 */
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
