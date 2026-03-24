# Google Play Games Services — Android Integration

This directory contains the two Kotlin files needed to wire Play Games Services
achievements into the PFTC Android app bundle.

---

## Achievement list

Register all eleven achievements in the **Play Console → Play Games Services →
Achievements** section.  Use the string names in the left column as each
achievement's *Achievement ID* when you create them.

| Achievement ID (Play Console) | Name | Type | Description |
|---|---|---|---|
| `achievement_off_the_tee` | Off the Tee | Standard | Complete your first hole |
| `achievement_front_nine` | Front Nine | Standard | Complete holes 1–9 |
| `achievement_full_round` | Full Round | Standard | Complete all 18 holes |
| `achievement_birdie` | Birdie | Standard | Score 1 under par on any hole |
| `achievement_eagle` | Eagle | Standard | Score 2 under par on any hole |
| `achievement_ace` | Ace | Standard | Score 3+ under par on any hole |
| `achievement_bogey_free` | Bogey-Free | Standard | Finish a round with no bogeys |
| `achievement_tour_champion` | Tour Champion | Standard | Finish a round at par or better |
| `achievement_scratch_golfer` | Scratch Golfer | Standard | Finish a round exactly at par |
| `achievement_cuemaster` | CueMaster | **Incremental (10 steps)** | Take 10 shots in the Cueing Emulator |
| `achievement_table_read` | Table Read | Standard | Shoot on all three table sizes in the Cueing Emulator |

> **Important:** `achievement_cuemaster` must be created as an **Incremental**
> achievement with a step count of **10**.  All others are Standard.

---

## Step 1 — Add Play Games Services to your Android project

In your app-level `build.gradle` (or `build.gradle.kts`):

```groovy
dependencies {
    implementation("com.google.android.gms:play-services-games-v2:20.1.2")
}
```

---

## Step 2 — Add your Games App ID

After creating your game in Play Console, copy the **Application ID** (a
numeric string like `1234567890123`).

Create (or update) `app/src/main/res/values/games-ids.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Replace with your Play Console Application ID -->
    <string name="app_id" translatable="false">YOUR_PLAY_GAMES_APP_ID</string>
</resources>
```

Add the meta-data entry to `AndroidManifest.xml` inside `<application>`:

```xml
<meta-data
    android:name="com.google.android.gms.games.APP_ID"
    android:value="@string/app_id" />
```

---

## Step 3 — Add the Kotlin files

Copy `PlayGamesInterface.kt` and `WebViewActivity.kt` into:

```
app/src/main/java/com/prometheangames/pftc/classic/
```

---

## Step 4 — Swap the launcher Activity in AndroidManifest.xml

Your existing manifest has a `LauncherActivity` from the TWA library.
Replace it with `WebViewActivity`:

```xml
<!-- BEFORE (remove this) -->
<activity
    android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
    ... >

<!-- AFTER (add this) -->
<activity
    android:name=".WebViewActivity"
    android:exported="true"
    android:theme="@style/Theme.AppCompat.NoActionBar"
    android:configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

You can keep any other `intent-filter` blocks (deep links, etc.) you already have.

---

## How it works at runtime

1. `WebViewActivity` loads `https://pftc-classic.replit.app` in a full-screen
   `WebView` (same URL as before, just no longer using Chrome Custom Tabs).
2. `PlayGamesInterface` is registered as `window.PlayGames` in JavaScript.
3. The web app calls `window.PlayGames?.unlockAchievement(id)` or
   `window.PlayGames?.incrementAchievement(id, steps)` at the right moments.
   If `window.PlayGames` is `undefined` (e.g. running in a browser) the calls
   are silent no-ops.
4. On first page load, `WebViewActivity` silently checks Play Games sign-in
   status.  If the user is not signed in, PGPS shows its own one-time consent
   prompt.

---

## Notes

- The `achievement_cuemaster` incremental achievement is incremented by 1 on
  every shot taken in the Cueing Emulator.  PGPS handles the cumulative count
  and unlocks the achievement automatically after 10 steps.
- `achievement_table_read` is tracked in `localStorage` on the web side.  The
  bridge call fires once all three standard table sizes (7ft, 8ft, 9ft) have
  each had at least one shot taken on them.
- All other achievements are idempotent — calling `unlock` on an already-
  unlocked achievement is a safe no-op in PGPS.
