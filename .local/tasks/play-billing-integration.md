# Google Play Billing Integration

## What & Why
Replace the Stripe-only paywall with a dual-path payment system. When the app runs inside a Trusted Web Activity (TWA) on Android, it uses the browser's Digital Goods API to trigger a native Google Play in-app purchase. When it runs in a regular browser (web/iOS), it falls back to the existing Stripe checkout. This satisfies Google Play's mandatory billing policy while preserving Stripe revenue on the web.

## Done looks like
- Running inside the TWA on Android shows a native Play Billing sheet when the user taps "Unlock All 18 Cards"
- Successful Play purchase is verified server-side via the Google Play Developer API; `pftc_unlocked` is set and holes 4-18 unlock immediately
- Running in a regular browser still uses Stripe exactly as it does today — no regression
- `/.well-known/assetlinks.json` is served as a static file from Express (SHA-256 placeholder ready to be filled in after PWABuilder generates the signing key)
- Environment variables `GOOGLE_PLAY_PACKAGE_NAME` and `GOOGLE_SERVICE_ACCOUNT_JSON` are documented in replit.md as required secrets

## Out of scope
- Generating the actual `assetlinks.json` SHA-256 fingerprint (that comes from PWABuilder in the next task)
- Google Play Console setup or creating the in-app SKU (manual step, documented but not automated)
- Subscription products — this is a one-time purchase only

## Tasks
1. **TWA context detection utility** — Add a `isRunningInTwa()` helper that returns `true` when `window.getDigitalGoodsService` is available (which only exists inside a TWA on Android with Play Billing enabled).

2. **Digital Goods API types** — Declare the necessary TypeScript ambient types for `window.getDigitalGoodsService`, `DigitalGoodsService`, and `PaymentRequest` with the `https://play.google.com/billing` payment method, since these are not in the standard TypeScript lib.

3. **Frontend dual-path checkout** — In `UnlockContext`, add `initiatePlayBillingCheckout()`. When called: call `getDigitalGoodsService`, fetch the `full_unlock` SKU details, construct a `PaymentRequest`, call `.show()`, extract the `purchaseToken` from the response, and call `POST /api/verify-play-purchase`. Also check for unconsumed purchases on mount (handles the case where the user purchased but the app crashed before the token was verified). Route `initiateCheckout()` through the TWA path when `isRunningInTwa()` is true, otherwise use Stripe.

4. **Backend Play purchase verification** — Add `POST /api/verify-play-purchase` to `server/routes.ts`. Accepts `{ purchaseToken, productId }`. Uses the `googleapis` npm package with the `GOOGLE_SERVICE_ACCOUNT_JSON` service account to call the Google Play Developer API `purchases.products.get` endpoint. Returns `{ unlocked: true }` if `purchaseState === 0` (purchased). Acknowledges the purchase if not yet acknowledged. Rate-limited. Validates inputs strictly before calling the API.

5. **Digital Asset Links endpoint** — Add a route in Express to serve `/.well-known/assetlinks.json` as a JSON response. The file at `client/public/.well-known/assetlinks.json` should be a template with the correct `package_name` (`com.prometheangames.parforcourse`) and a placeholder `sha256_cert_fingerprints` array so the file is ready to be updated after PWABuilder produces the real fingerprint.

6. **Update replit.md** — Document the two new required secrets (`GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_SERVICE_ACCOUNT_JSON`), the TWA detection approach, and the `full_unlock` SKU ID.

## Relevant files
- `client/src/contexts/UnlockContext.tsx`
- `client/src/components/UnlockBanner.tsx`
- `server/routes.ts`
- `client/public/manifest.json`
- `replit.md`
