# Google Play Games Services — Android Integration

This directory contains the three Kotlin/Java files needed to wire Play Games
Services into the PFTC Android app bundle.

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

In your **app-level** `build.gradle` (or `build.gradle.kts`):

```groovy
dependencies {
    implementation "com.google.android.gms:play-services-games-v2:+"
}
```

In your **project-level** `build.gradle`, confirm both sections include the
Google and Maven Central repositories:

```groovy
buildscript {
    repositories {
        google()
        mavenCentral()
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

---

## Step 2 — Add your Games Project ID

After creating your game in Play Console, find the **Project ID** (a numeric
string like `0000000000`) on the **Play Games Services → Configuration** page.

**`app/src/main/res/values/strings.xml`** — add this entry:

```xml
<!-- Replace 0000000000 with your game's project ID -->
<string translatable="false" name="game_services_project_id">0000000000</string>
```

**`AndroidManifest.xml`** — add inside `<application>`:

```xml
<meta-data
    android:name="com.google.android.gms.games.APP_ID"
    android:value="@string/game_services_project_id" />
```

---

## Step 3 — Register the custom Application class

The Play Games SDK **must** be initialised in `Application.onCreate()`, not in
an Activity.  Add `android:name=".PFTCApplication"` to the `<application>`
element in `AndroidManifest.xml`:

```xml
<application
    android:name=".PFTCApplication"
    android:label="@string/app_name"
    ... >
```

---

## Step 4 — Copy the Kotlin files

Copy all three files into:

```
app/src/main/java/com/prometheangames/pftc/classic/
```

| File | Purpose |
|---|---|
| `PFTCApplication.kt` | Custom Application class — initialises the Play Games SDK |
| `WebViewActivity.kt` | Full-screen WebView that loads the PWA and injects the JS bridge |
| `PlayGamesInterface.kt` | `window.PlayGames` JavaScript bridge for achievements |

---

## Step 5 — Swap the launcher Activity in AndroidManifest.xml

Replace the standard TWA `LauncherActivity` with `WebViewActivity`:

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

1. `PFTCApplication.onCreate()` initialises the Play Games SDK with the
   application context before any Activity starts.
2. `WebViewActivity` loads `https://pftc-classic.replit.app` in a full-screen
   `WebView`.  On page load it checks `isAuthenticated`; if the user is not
   signed in it calls `signIn()`, which triggers the PGPS one-time consent prompt.
3. `PlayGamesInterface` is registered as `window.PlayGames` in JavaScript.
4. The web app calls `window.PlayGames?.unlockAchievement(id)` or
   `window.PlayGames?.incrementAchievement(id, steps)` at the right moments.
   If `window.PlayGames` is `undefined` (e.g. running in a browser) the calls
   are silent no-ops.

---

## Notes

- `achievement_cuemaster` is an incremental achievement (10 steps).  It is
  incremented by 1 on every shot taken in the Cueing Emulator.  PGPS handles
  the cumulative count and unlocks the achievement automatically after 10 steps.
- `achievement_table_read` is tracked in `localStorage` on the web side.  The
  bridge call fires once all three standard table sizes (7ft, 8ft, 9ft) have
  each had at least one shot taken on them.
- All other achievements are idempotent — calling `unlock` on an already-
  unlocked achievement is a safe no-op in PGPS.
