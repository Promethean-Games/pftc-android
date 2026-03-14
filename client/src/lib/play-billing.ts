declare global {
  interface Window {
    getDigitalGoodsService?: (
      serviceProvider: string
    ) => Promise<DigitalGoodsService>;
  }
}

interface DigitalGoodsService {
  getDetails(itemIds: string[]): Promise<ItemDetails[]>;
  listPurchases(): Promise<PurchaseDetails[]>;
}

interface ItemDetails {
  itemId: string;
  title: string;
  description: string;
  price: { currency: string; value: string };
  type: "product" | "subscription";
}

interface PurchaseDetails {
  itemId: string;
  purchaseToken: string;
}

const PLAY_BILLING_METHOD = "https://play.google.com/billing";
const PRODUCT_ID = "full_unlock";

export function isRunningInTwa(): boolean {
  return typeof window.getDigitalGoodsService === "function";
}

export async function initiatePlayBillingCheckout(): Promise<{
  purchaseToken: string;
  productId: string;
} | null> {
  if (!isRunningInTwa()) return null;

  const service = await window.getDigitalGoodsService!(PLAY_BILLING_METHOD);
  const details = await service.getDetails([PRODUCT_ID]);

  if (!details || details.length === 0) {
    throw new Error("Product not found in Play Store");
  }

  const methodData: PaymentMethodData = {
    supportedMethods: PLAY_BILLING_METHOD,
    data: { sku: PRODUCT_ID },
  };

  const paymentDetails: PaymentDetailsInit = {
    total: {
      label: details[0].title || "Unlock All 18 Cards",
      amount: { currency: "USD", value: "0" },
    },
  };

  const request = new PaymentRequest([methodData], paymentDetails);
  const response = await request.show();

  const responseData = response.details as {
    purchaseToken?: string;
    token?: string;
  };
  const purchaseToken = responseData.purchaseToken || responseData.token;

  await response.complete("success");

  if (!purchaseToken) {
    throw new Error("No purchase token received from Play Billing");
  }

  return { purchaseToken, productId: PRODUCT_ID };
}

export async function checkPendingPurchases(): Promise<{
  purchaseToken: string;
  productId: string;
} | null> {
  if (!isRunningInTwa()) return null;

  try {
    const service = await window.getDigitalGoodsService!(PLAY_BILLING_METHOD);
    const purchases = await service.listPurchases();

    const fullUnlock = purchases.find((p) => p.itemId === PRODUCT_ID);
    if (fullUnlock) {
      return {
        purchaseToken: fullUnlock.purchaseToken,
        productId: PRODUCT_ID,
      };
    }
  } catch {
    // Silently ignore — pending purchase check is best-effort
  }

  return null;
}
