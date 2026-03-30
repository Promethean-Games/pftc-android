package com.prometheangames.pftc.classic

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.games.PlayGames

/**
 * Full-screen WebView Activity that hosts the PFTC Progressive Web App
 * and injects the PlayGamesInterface JavaScript bridge.
 *
 * This replaces the standard TWA LauncherActivity in AndroidManifest.xml:
 *
 *   <!-- Replace this: -->
 *   <activity android:name="com.google.androidbrowserhelper.trusted.LauncherActivity" ...>
 *
 *   <!-- With this: -->
 *   <activity android:name=".WebViewActivity" ...>
 *
 * The rest of the intent-filter block (VIEW/DEFAULT/BROWSABLE + data scheme/host)
 * stays exactly the same.
 */
class WebViewActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    companion object {
        private const val APP_URL = "https://pftc-classic.replit.app"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled        = true
            domStorageEnabled        = true
            databaseEnabled          = true
            cacheMode                = WebSettings.LOAD_DEFAULT
            allowContentAccess       = true
            allowFileAccess          = true
            mediaPlaybackRequiresUserGesture = false
        }

        // Inject the Play Games bridge as window.PlayGames
        webView.addJavascriptInterface(PlayGamesInterface(this), "PlayGames")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                attemptSilentSignIn()
            }
        }

        webView.loadUrl(APP_URL)
    }

    /**
     * Try to sign the user into Play Games silently.
     * If they have never signed in on this device, PGPS will show its own
     * one-time consent prompt automatically via signIn().
     */
    private fun attemptSilentSignIn() {
        PlayGames.getGamesSignInClient(this).isAuthenticated
            .addOnCompleteListener { task ->
                if (task.isSuccessful && !task.result.isAuthenticated) {
                    PlayGames.getGamesSignInClient(this).signIn()
                }
            }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
