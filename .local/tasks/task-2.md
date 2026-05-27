---
title: Play Store launch prep
---
# Play Store Launch Prep

## What & Why
Everything needed to submit the app to Google Play after the billing code is in place. This covers deploying the React app to a public production URL, generating the Trusted Web Activity (TWA) Android package via PWABuilder, wiring up Digital Asset Links with the real signing fingerprint, creating the required store listing assets (feature graphic + screenshots), and writing the store listing copy.

## Done looks like
- App is live at a stable public HTTPS URL (Replit deployment)
- `/.well-known/assetlinks.json` contains the real SHA-256 fingerprint from PWABuilder so the TWA hides the browser address bar
- An Android App Bundle (AAB) file is ready to upload to Google Play Console
- A 1024×500 feature graphic PNG exists and is saved to the repo
- At least 2 phone screenshots are captured and saved
- Short description (≤80 chars) and full description (≤4000 chars) are written and committed to the repo as `store-listing.md`
- `replit.md` documents the full end-to-end deployment and TWA packaging steps for future maintainers

## Out of scope
- Creating the Google Play Developer Console account or paying the $25 fee (user must do this manually)
- Creating the `full_unlock` in-app product SKU in the Play Console (user must do this manually — price and product ID `full_unlock` are documented)
- App review and approval (Google's process, not buildable)
- iOS App Store submission

## Tasks
1. **Deploy to production** — Use Replit's deployment system to publish the React app and confirm it is accessible at a stable public HTTPS URL. Record the URL in `replit.md`.

2. **Generate TWA package via PWABuilder** — Document step-by-step instructions in `store-listing.md` for running PWABuilder (pwabuilder.com) against the deployed URL: entering the URL, downloading the Android package, noting the SHA-256 signing fingerprint from the generated `assetlinks.json`.

3. **Wire Digital Asset Links** — Update `client/public/.well-known/assetlinks.json` (the placeholder from the previous task) with the real SHA-256 fingerprint obtained from PWABuilder. Redeploy so the live URL serves the correct file.

4. **Feature graphic** — Generate a 1024×500 PNG feature graphic for the Play Store listing that matches the app's green-on-dark aesthetic, showing the app name "Par for the Course" and a visual of the billiards table. Save to `store-assets/feature-graphic.png`.

5. **Store listing copy** — Write `store-assets/store-listing.md` containing: short description (≤80 chars), full description (≤4000 chars covering gameplay, CueMaster Tools, free vs paid holes, physical card deck compatibility), content rating answers (Everyone), and a checklist of manual Play Console steps the user must complete.

## Relevant files
- `client/public/.well-known/assetlinks.json`
- `client/public/manifest.json`
- `replit.md`