import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";

const STRIPE_SESSION_ID_PATTERN = /^cs_(test_|live_)[a-zA-Z0-9]{10,300}$/;

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

export async function registerRoutes(app: Express): Promise<Server> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePriceId = process.env.STRIPE_PRICE_ID;

  let stripe: Stripe | null = null;
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey);
  }

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

  const httpServer = createServer(app);
  return httpServer;
}
