package com.prometheangames.pftc.classic

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.games.PlayGames

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
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowContentAccess = true
            allowFileAccess = true
            mediaPlaybackRequiresUserGesture = false
        }

        webView.addJavascriptInterface(PlayGamesInterface(this), "PlayGames")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                attemptSignIn()
            }
        }

        webView.loadUrl(APP_URL)
    }

    private fun attemptSignIn() {
        PlayGames.getGamesSignInClient(this).isAuthenticated
            .addOnCompleteListener { task ->
                if (task.isSuccessful && !task.result.isAuthenticated) {
                    PlayGames.getGamesSignInClient(this).signIn()
                }
            }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
