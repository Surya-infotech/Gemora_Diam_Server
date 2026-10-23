/**
 * PayPal REST API v2 Utility for Gemora Diam Atelier
 * Supports both Sandbox and Live environments
 */

const getPayPalCredentials = () => {
    const clientId = process.env.CLIENT_ID || process.env.Client_ID || process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.SECRET_KEY || process.env.Secret_key || process.env.PAYPAL_SECRET_KEY;
    const mode = (process.env.PAYPAL_ENV || process.env.PAYPAL_MODE || "sandbox").toLowerCase();
    const baseUrl = mode === "live" || mode === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials (CLIENT_ID and SECRET_KEY) not found in server environment variables.");
    }

    return { clientId: clientId.trim(), clientSecret: clientSecret.trim(), baseUrl, mode };
};

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Fetch OAuth2 Access Token from PayPal
 */
const getPayPalAccessToken = async () => {
    const now = Date.now();
    if (cachedToken && tokenExpiresAt > now + 60000) {
        return cachedToken;
    }

    const { clientId, clientSecret, baseUrl } = getPayPalCredentials();
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    const data = await response.json();
    if (!response.ok || !data.access_token) {
        console.error("PayPal OAuth failed:", data);
        const detail = data.error_description || data.message || "Failed to authenticate with PayPal";
        throw new Error(`PayPal Authentication Error: ${detail}`);
    }

    cachedToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in * 1000);
    return cachedToken;
};

/**
 * Create a PayPal Order with intent CAPTURE
 */
const createPayPalOrder = async ({ amount, currency = "USD", description = "Gemora Diam Fine Jewelry" }) => {
    const { baseUrl } = getPayPalCredentials();
    const accessToken = await getPayPalAccessToken();

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error("Invalid order total amount for PayPal.");
    }
    const formattedAmount = numericAmount.toFixed(2);

    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: (currency || "USD").toUpperCase(),
                    value: formattedAmount
                },
                description: description.substring(0, 127)
            }
        ],
        application_context: {
            brand_name: "Gemora Diam Atelier",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW"
        }
    };

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const order = await response.json();
    if (!response.ok || !order.id) {
        console.error("PayPal Create Order Failed:", JSON.stringify(order, null, 2));
        const detail = order.details?.[0];
        let errMsg = order.message || "Failed to create PayPal order";
        if (detail) {
            if (detail.issue === "PAYEE_ACCOUNT_RESTRICTED") {
                errMsg = "Your live PayPal merchant account is restricted by PayPal (PAYEE_ACCOUNT_RESTRICTED). Please complete account verification / KYC / export purpose code in your PayPal Business Dashboard, or switch to Sandbox mode for testing.";
            } else {
                errMsg = `${detail.issue ? detail.issue + ": " : ""}${detail.description || ""}`;
            }
        }
        throw new Error(errMsg);
    }

    return order;
};

/**
 * Capture payment for an approved PayPal Order
 */
const capturePayPalOrder = async (paypalOrderId) => {
    if (!paypalOrderId) {
        throw new Error("PayPal Order ID is required for capture.");
    }

    const { baseUrl } = getPayPalCredentials();
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    });

    const captureData = await response.json();
    if (!response.ok) {
        console.error("PayPal Capture Failed:", JSON.stringify(captureData, null, 2));
        const detail = captureData.details?.[0];
        let errMsg = captureData.message || "Failed to capture PayPal payment";
        if (detail) {
            errMsg = `${detail.issue ? detail.issue + ": " : ""}${detail.description || ""}`;
        }
        throw new Error(errMsg);
    }

    return captureData;
};

module.exports = {
    getPayPalCredentials,
    getPayPalAccessToken,
    createPayPalOrder,
    capturePayPalOrder
};