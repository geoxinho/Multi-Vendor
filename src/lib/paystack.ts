const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE_URL = "https://api.paystack.co";

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: { authorization_url: string; access_code: string; reference: string };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    paid_at: string;
  };
}

export async function initializePayment(
  email: string,
  amountNGN: number,
  reference: string,
  callbackUrl: string
): Promise<PaystackInitResponse> {
  const res = await fetch(`${BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amountNGN * 100), // kobo
      reference,
      callback_url: callbackUrl,
    }),
  });
  return res.json();
}

export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  const res = await fetch(`${BASE_URL}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  return res.json();
}
