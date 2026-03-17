import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import Stripe from "stripe";
import { GoogleAuth } from "google-auth-library";
import rateLimit from "express-rate-limit";

const STRIPE_SESSION_ID_PATTERN = /^cs_(test_|live_)[a-zA-Z0-9]{10,300}$/;
const PLAY_PURCHASE_TOKEN_PATTERN = /^[a-zA-Z0-9._-]{20,500}$/;
const PLAY_PRODUCT_ID_PATTERN = /^[a-z][a-z0-9_.]{0,99}$/;

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout requests, please try again later" },
});

const statusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many status checks, please try again later" },
});

const playVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification requests, please try again later" },
});

function getGoogleAuth(): GoogleAuth | null {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) return null;
  try {
    const credentials = JSON.parse(serviceAccountJson);
    return new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
  } catch {
    console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON");
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePriceId = process.env.STRIPE_PRICE_ID;
  const playPackageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.prometheangames.parforthecourse";

  let stripe: Stripe | null = null;
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey);
  }

  // Server-side analytics proxy — forwards anonymous events to PostHog.
  // Routing through our server avoids ad-blocker interference and keeps
  // the API key server-side only.
  const analyticsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const ALLOWED_EVENTS = new Set([
    "app_opened", "game_started", "game_completed",
    "paywall_encountered", "purchase_initiated", "purchase_completed",
    "tool_opened", "tutorial_viewed",
  ]);

  app.post("/api/analytics/capture", analyticsLimiter, async (req, res) => {
    const posthogKey = process.env.VITE_POSTHOG_KEY;
    if (!posthogKey) { res.json({ ok: false, reason: "no_key" }); return; }

    const { event, properties, sessionId } = req.body ?? {};
    if (!event || typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
      res.json({ ok: false, reason: "invalid_event" }); return;
    }

    try {
      const phRes = await fetch("https://us.i.posthog.com/capture/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: posthogKey,
          event,
          distinct_id: typeof sessionId === "string" && sessionId.length < 64
            ? sessionId
            : "anonymous",
          properties: typeof properties === "object" && properties !== null ? properties : {},
        }),
      });
      if (!phRes.ok) {
        const phBody = await phRes.text();
        console.error(`[analytics proxy] PostHog ${phRes.status}: ${phBody}`);
      }
      res.json({ ok: phRes.ok });
    } catch (err) {
      console.error("[analytics proxy] fetch error:", err);
      res.json({ ok: false, reason: "upstream_error" });
    }
  });

  // Explicit route for Digital Asset Links (required for TWA / Play Store association).
  // google-auth-library (direct REST) is used instead of the googleapis package for
  // simplicity — it avoids the heavier googleapis dependency while achieving the same result.
  app.get("/.well-known/assetlinks.json", (_req, res) => {
    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, "dist/public/.well-known/assetlinks.json"), // production build
      path.join(cwd, "client/public/.well-known/assetlinks.json"), // development source
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (!filePath) {
      return res.status(404).json({ error: "assetlinks.json not found" });
    }
    res.setHeader("Content-Type", "application/json");
    res.sendFile(filePath);
  });

  app.get("/privacy", (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy & Terms - Par for the Course</title>
<meta name="description" content="Privacy Policy and Terms of Use for the Par for the Course billiards training app by Promethean Games LLC.">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#111;color:#e8e8ea;padding:24px;line-height:1.6}
.container{max-width:640px;margin:0 auto}
h1{font-size:22px;margin-bottom:4px}
.sub{color:#888;font-size:12px;margin-bottom:24px}
section{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:12px}
h2{font-size:14px;font-weight:600;margin-bottom:8px}
p,li{color:#b8b8bf;font-size:13px;line-height:1.6}
ul{padding-left:18px}
li{margin-bottom:4px}
a{color:#93c5fd;text-decoration:underline}
</style>
</head>
<body>
<div class="container">
<h1>Terms of Use & Privacy Policy</h1>
<p class="sub">Promethean Games LLC &middot; Effective Oct 23, 2025</p>
<section><h2>1. Acceptance</h2><p>By using the Par for the Course Scorekeeper (&ldquo;App&rdquo;), you agree to these Terms and this Privacy Policy. If you do not agree, please do not use the App.</p></section>
<section><h2>2. Purpose</h2><p>The App is a scorekeeping and training tool for Par for the Course billiards training. It is not for gambling or betting.</p></section>
<section><h2>3. Your Use</h2><ul><li>Use the App lawfully and responsibly.</li><li>Do not reverse-engineer, redistribute, or inject harmful content.</li></ul></section>
<section><h2>4. Intellectual Property</h2><p>All names, layouts, and designs are &copy; Promethean Games LLC. Do not reuse without written permission.</p></section>
<section><h2>5. Warranty &amp; Liability</h2><p>The App is provided &ldquo;as is&rdquo;. We do not guarantee uptime or error-free operation. Promethean Games LLC is not liable for damages or data loss.</p></section>
<section><h2>6. Privacy &amp; Data Collection</h2><ul>
<li><strong>No personal data</strong> is sent to our servers. Player names, scores, and game settings stay on your device in local browser storage.</li>
<li><strong>Payment processing</strong> is handled by Stripe. When you purchase the full version, Stripe collects your payment information directly. We do not store or have access to your payment details. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe&rsquo;s Privacy Policy</a>.</li>
<li><strong>Device sensors</strong>: The Table Leveler feature uses your device&rsquo;s accelerometer/gyroscope. This data is processed locally and is never transmitted to any server.</li>
<li><strong>Google Fonts</strong>: The App loads fonts from Google&rsquo;s servers. Google may collect standard web request data (IP address, browser type). See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google&rsquo;s Privacy Policy</a>.</li>
<li><strong>No third-party ads or analytics</strong>. No tracking cookies or advertising identifiers are used.</li>
<li><strong>No account required</strong>. The App does not require sign-up, login, or any personal information to use.</li>
</ul></section>
<section><h2>7. Data Stored on Your Device</h2><p>The App stores the following data locally in your browser:</p><ul>
<li>Game sessions (player names, scores, turn timing)</li>
<li>Saved games</li>
<li>App settings (theme, display preferences)</li>
<li>Purchase unlock status</li>
<li>Table Leveler calibration data</li>
</ul><p>This data never leaves your device unless you choose to share it.</p></section>
<section><h2>8. Data Retention &amp; Deletion</h2><p>Saved games and settings remain on your device until you delete them. You can delete all app data at any time from the Privacy Policy screen within the App. Uninstalling the App also removes all local data.</p></section>
<section><h2>9. Children&rsquo;s Privacy</h2><p>The App does not knowingly collect personal information from children under 13. Since no personal data is collected or transmitted, the App is suitable for users of all ages.</p></section>
<section><h2>10. Changes &amp; Contact</h2><p>We may update these terms. Continued use after an update means you accept the revised version.</p><p style="margin-top:8px">Contact: <a href="mailto:support@promethean-games.com">support@promethean-games.com</a> &middot; <a href="https://www.Promethean-Games.com" target="_blank" rel="noopener">Promethean-Games.com</a></p></section>
</div>
</body>
</html>`);
  });

  app.post("/api/create-checkout-session", checkoutLimiter, async (req, res) => {
    if (!stripe || !stripePriceId) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }

    try {
      const origin = `${req.protocol}://${req.get("host")}`;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `${origin}/?unlock=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?unlock=cancelled`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.get("/api/check-unlock-status", statusLimiter, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }

    try {
      const sessionId = req.query.session_id as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Missing session_id" });
      }

      if (!STRIPE_SESSION_ID_PATTERN.test(sessionId)) {
        return res.status(400).json({ error: "Invalid session_id format" });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json({ unlocked: session.payment_status === "paid" });
    } catch (error) {
      console.error("Error checking unlock status:", error);
      res.status(500).json({ error: "Failed to check unlock status" });
    }
  });

  app.post("/api/verify-play-purchase", playVerifyLimiter, async (req, res) => {
    const googleAuth = getGoogleAuth();
    if (!googleAuth) {
      return res.status(500).json({ error: "Google Play verification is not configured" });
    }

    try {
      const { purchaseToken, productId } = req.body;

      if (!purchaseToken || typeof purchaseToken !== "string") {
        return res.status(400).json({ error: "Missing or invalid purchaseToken" });
      }
      if (!productId || typeof productId !== "string") {
        return res.status(400).json({ error: "Missing or invalid productId" });
      }
      if (!PLAY_PURCHASE_TOKEN_PATTERN.test(purchaseToken)) {
        return res.status(400).json({ error: "Invalid purchaseToken format" });
      }
      if (!PLAY_PRODUCT_ID_PATTERN.test(productId)) {
        return res.status(400).json({ error: "Invalid productId format" });
      }

      const ALLOWED_PRODUCT_IDS = ["full_unlock"];
      if (!ALLOWED_PRODUCT_IDS.includes(productId)) {
        return res.status(403).json({ error: "Product not eligible for unlock" });
      }

      const client = await googleAuth.getClient();
      const accessToken = await client.getAccessToken();

      const verifyUrl =
        `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
        `${encodeURIComponent(playPackageName)}/purchases/products/` +
        `${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;

      const verifyRes = await fetch(verifyUrl, {
        headers: { Authorization: `Bearer ${accessToken.token}` },
      });

      if (!verifyRes.ok) {
        const errorBody = await verifyRes.text();
        console.error("Play API verify error:", verifyRes.status, errorBody);
        return res.status(502).json({ error: "Failed to verify purchase with Google Play" });
      }

      const purchase = (await verifyRes.json()) as {
        purchaseState: number;
        acknowledgementState: number;
        consumptionState: number;
      };

      // purchaseState: 0 = Purchased, 1 = Canceled, 2 = Pending
      if (purchase.purchaseState !== 0) {
        return res.json({ unlocked: false });
      }

      // Acknowledge the purchase if not yet acknowledged (required by Google
      // within 3 days or the purchase is automatically refunded)
      if (purchase.acknowledgementState === 0) {
        const ackUrl = `${verifyUrl}:acknowledge`;
        const ackRes = await fetch(ackUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!ackRes.ok) {
          const ackError = await ackRes.text();
          console.error("Play API acknowledge error:", ackRes.status, ackError);
          return res.status(502).json({ error: "Purchase verified but acknowledgement failed. Please try again." });
        }
      }

      res.json({ unlocked: true });
    } catch (error) {
      console.error("Error verifying Play purchase:", error);
      res.status(500).json({ error: "Failed to verify purchase" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
