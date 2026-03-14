# Par for the Course — Google Play Store Listing

## Short Description (80 chars max)

Billiards training card game with physics-based shot simulator & table tools.

## Full Description (4000 chars max)

Par for the Course turns the pool table into a golf course. Draw a card, set up the balls, and clear the table in fewer strokes than par. Play solo or with friends in local multiplayer — no accounts, no ads, just pool.

HOW IT WORKS
Each card shows a ball layout (a "hole"). Set up the balls exactly as shown, then take turns clearing the table — stripes first, then solids. Every shot attempt counts as a stroke. Finish under par for birdie, over par for bogey. Play up to 18 holes and track scores for up to 8 players.

The physical card deck (sold separately) creates the layouts. The first 3 holes are free in the app; unlock all 18 holes with a one-time purchase.

CUEMASTER TOOLS
Built-in tools to sharpen your game:

Cueing Emulator — A physics-based shot simulator right on your phone. Place balls on a virtual 9-foot table, aim the cue ball, adjust speed and spin (English), and watch the full trajectory play out. See exactly where every ball will go before you shoot.
- Drag to aim, tap to place balls
- Adjust shot speed, fine-tune angle, and apply English (top/bottom/left/right spin)
- See squirt, swerve, throw, and rail effects based on real physics research (Dr. Dave Alciatore, Colorado State University)
- Configure table speed, equipment condition, and rail firmness

Table Leveler — Turn your phone into a digital spirit level. Place it on the table surface and check if the table is flat. Calibrate for your home table, league venue, or tournament hall with three independent presets.

FEATURES
- Local multiplayer for 1-8 players
- Full 18-hole scoring with leaderboard
- Save and load games — pick up where you left off
- Automatic player rotation based on previous hole scores
- Per-turn timing and post-game analytics (pace, streaks, consistency)
- Dark mode and light mode
- Left-handed mode for comfortable one-handed play
- Works offline after first load (Progressive Web App)
- Privacy-first: no accounts, no tracking, no ads

SCORING
- Under par: Birdie, Eagle, or Ace
- At par: Par
- Over par: Bogey, Double Bogey, Triple Bogey
- Joker cards let the current player design a custom layout or replay a favorite hole

DESIGNED FOR THE TABLE
Bold, high-contrast interface designed for outdoor and bar lighting. Large touch targets for one-handed operation. Auto-saves your game so you never lose progress.

PRIVACY
No personal data collected. No analytics. No advertising. Player names stay on your device. Full privacy policy and data deletion available in-app.

## Content Rating Questionnaire Answers

- **Violence**: No
- **Sexual Content**: No
- **Language**: No
- **Controlled Substance**: No
- **Gambling**: No (randomized card draws select table layouts, not gambling outcomes)
- **User Interaction**: No (local multiplayer only, no online features)
- **Data Sharing**: No personal data collected or shared
- **Recommended Rating**: Everyone

## App Category

- **Category**: Sports
- **Tags**: billiards, pool, training, card game, cue sports

## Contact Information

- **Email**: support@promethean-games.com
- **Website**: https://promethean-games.com

## In-App Purchase

- **Product ID**: `full_unlock`
- **Type**: Managed product (one-time purchase)
- **Title**: Unlock All 18 Courses
- **Description**: Unlock holes 4 through 18 for the full Par for the Course experience. Includes all 16 course card layouts plus 2 joker cards.
- **Price**: Set in Google Play Console (suggested: $1.99 - $4.99 USD)

---

## PWABuilder TWA Packaging Steps

Follow these steps to generate the Android App Bundle (AAB) for Google Play submission:

### Prerequisites
- App must be deployed to a stable public HTTPS URL (Replit deployment)
- `/.well-known/assetlinks.json` must be accessible at the deployed URL

### Step-by-Step

1. **Go to [pwabuilder.com](https://www.pwabuilder.com/)**
2. **Enter the production URL** of the deployed app (e.g., `https://par-for-the-course.replit.app`)
3. **Click "Start"** — PWABuilder will analyze the manifest, service worker, and security headers
4. **Review the PWA score** — ensure it meets all requirements (manifest, service worker, HTTPS)
5. **Click "Package for stores"** and select **"Android"**
6. **Configure the Android package**:
   - **Package ID**: `com.prometheangames.parforcourse`
   - **App name**: Par for the Course
   - **App version**: `1.0.0`
   - **App version code**: `1`
   - **Host**: your deployed URL (without trailing slash)
   - **Start URL**: `/?source=pwa`
   - **Theme color**: `#16a34a`
   - **Background color**: `#111111`
   - **Splash screen fade out duration**: `300` (milliseconds)
   - **Navigation color**: `#111111`
   - **Navigation color (dark)**: `#111111`
   - **Icon URL**: use the 512x512 icon from the manifest
   - **Maskable icon URL**: same 512x512 icon (already configured as maskable)
   - **Signing key**: **Let PWABuilder generate a new signing key** (save the keystore file and passwords securely!)
   - **Display mode**: `Standalone`
   - **Notification delegation**: disabled (app doesn't use push notifications)
   - **Location delegation**: disabled
   - **Play Billing**: enabled (for in-app purchases via Digital Goods API)
7. **Click "Download"** — PWABuilder generates a ZIP containing:
   - `app-release.aab` — the Android App Bundle to upload to Play Console
   - `assetlinks.json` — contains the SHA-256 signing fingerprint
   - `signing-key-info.txt` — keystore password and alias (KEEP SECURE)
8. **Extract the SHA-256 fingerprint** from the generated `assetlinks.json`:
   - Open the `assetlinks.json` from the downloaded ZIP
   - Copy the `sha256_cert_fingerprints` value (format: `XX:XX:XX:...`)
9. **Update `client/public/.well-known/assetlinks.json`** in the repo:
   - Replace `PLACEHOLDER:REPLACE_WITH_SHA256_FROM_PWABBUILDER` with the real fingerprint
   - Redeploy the app so the live URL serves the updated file
10. **Verify Digital Asset Links** at:
    `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://YOUR-DOMAIN&relation=delegate_permission/common.handle_all_urls`

### Google Play Console Setup

1. **Create a developer account** at [play.google.com/console](https://play.google.com/console) ($25 one-time fee)
2. **Create a new app**:
   - App name: Par for the Course
   - Default language: English (United States)
   - App or game: Game
   - Free or paid: Free (with in-app purchases)
3. **Upload the AAB** from PWABuilder to Production or Internal Testing track
4. **Store listing**:
   - Use the short description and full description from this file
   - Upload the feature graphic from `store-assets/feature-graphic.png`
   - Upload phone screenshots (capture from deployed app on a real device or emulator)
5. **Content rating**: Complete the questionnaire (all answers: No — see above)
6. **Pricing & distribution**: Free, with in-app purchases
7. **Create the in-app product**:
   - Go to Monetize > Products > In-app products
   - Product ID: `full_unlock`
   - Title: Unlock All 18 Courses
   - Description: Access all 18 course card layouts including joker cards
   - Price: your chosen price
   - Status: Active
8. **Set up Play Billing API access**:
   - Go to Google Cloud Console
   - Create a service account with `Android Publisher` role
   - Download the JSON key
   - Add the JSON key as `GOOGLE_SERVICE_ACCOUNT_JSON` secret in Replit
   - In Play Console: Settings > API access > link the service account
9. **Submit for review**

### Important Notes
- Keep the signing keystore file and passwords in a secure location — you need them for every future update
- The SHA-256 fingerprint in `assetlinks.json` must match the signing key used for the AAB
- If you use Play App Signing (recommended), Google may assign a different upload key; use the **App Signing key fingerprint** from Play Console > Setup > App signing
- After updating `assetlinks.json`, wait for the new deployment to propagate before testing TWA bar hiding

---

## Release Readiness Checklist

Before submitting for review, complete all mandatory Play Console declarations:

### Mandatory Declarations
- [ ] **Data safety form** — Go to App content > Data safety. Since no personal data is collected or shared, select "No" for all data types. Mention that the app uses localStorage for game data (stays on device) and processes payments through Google Play Billing (handled by Google, not the app).
- [ ] **App access** — Go to App content > App access. Select "All functionality is available without special access" (no login or account required).
- [ ] **Ads declaration** — Go to App content > Ads. Select "No, my app does not contain ads."
- [ ] **Target audience and content** — Go to App content > Target audience and content. Set target age group to 13+ or All ages (app is COPPA-compliant with no data collection).
- [ ] **Privacy policy URL** — Go to App content > Privacy policy. Enter the production URL: `https://<your-domain>/privacy`
- [ ] **Government apps** — Go to App content > Government apps. Select "No."
- [ ] **Financial features** — Go to App content > Financial features. Select "No" (the app doesn't provide financial services; in-app purchase is handled by Play Billing).

### Store Listing Assets
- [ ] **Feature graphic** — Upload `store-assets/feature-graphic.png` (1024x500)
- [ ] **Phone screenshots** — Capture at least 2 screenshots from the deployed app (required: 320-3840px per side, 16:9 or 9:16 ratio). Recommended screens to capture: Splash screen, Game screen with cards, Cueing Emulator, Summary/Leaderboard
- [ ] **Short description** — Copy from this file (80 chars max)
- [ ] **Full description** — Copy from this file (4000 chars max)

### Technical Verification
- [ ] `/.well-known/assetlinks.json` has the real SHA-256 fingerprint (not placeholder)
- [ ] Digital Asset Links verification passes at `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://YOUR-DOMAIN&relation=delegate_permission/common.handle_all_urls`
- [ ] TWA hides the browser address bar on a test device
- [ ] In-app product `full_unlock` is created and active in Play Console
- [ ] Service account is linked in Play Console → Settings → API Access with financial data permissions
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` secret is set in Replit deployment environment
- [ ] Play Billing purchase flow works end-to-end in a test/internal track build
