import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePriceId = process.env.STRIPE_PRICE_ID;

  let stripe: Stripe | null = null;
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey);
  }

  app.post("/api/create-checkout-session", async (req, res) => {
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

  app.get("/api/check-unlock-status", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }

    try {
      const sessionId = req.query.session_id as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Missing session_id" });
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
