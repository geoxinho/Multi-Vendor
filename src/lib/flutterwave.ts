const BASE_URL = "https://api.flutterwave.com/v3";

export function getFlwSecretKey(): string {
  return (
    process.env.FLW_SECRET_KEY ||
    process.env.Secret_Key ||
    process.env.FLUTTERWAVE_SECRET_KEY ||
    ""
  ).trim();
}

export function getFlwPublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY ||
    process.env.FLW_PUBLIC_KEY ||
    process.env.Public_Key ||
    ""
  ).trim();
}

export function getFlwEncryptionKey(): string {
  return (
    process.env.FLW_ENCRYPTION_KEY ||
    process.env.Encryption_Key ||
    process.env.FLUTTERWAVE_ENCRYPTION_KEY ||
    ""
  ).trim();
}

export interface FlutterwaveVerifyResponse {
  status: "success" | "error";
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: "successful" | "failed" | string;
    payment_type?: string;
    customer?: {
      id?: number;
      name?: string;
      email?: string;
      phone_number?: string;
    };
  };
}

export interface FlutterwaveResolveResponse {
  status: "success" | "error";
  message: string;
  data?: {
    account_number: string;
    account_name: string;
  };
}

export interface FlutterwaveBank {
  id: number;
  code: string;
  name: string;
}

export interface FlutterwaveBanksResponse {
  status: "success" | "error";
  message: string;
  data?: FlutterwaveBank[];
}

export interface FlutterwaveTransferResponse {
  status: "success" | "error";
  message: string;
  data?: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    narration: string;
  };
}

/**
 * Verifies a Flutterwave transaction either by Transaction ID or Transaction Reference (tx_ref).
 */
export async function verifyTransaction(
  txIdOrRef: string | number
): Promise<FlutterwaveVerifyResponse> {
  const secret = getFlwSecretKey();
  if (!secret) {
    throw new Error("Flutterwave secret key is not configured.");
  }

  const queryParam = String(txIdOrRef).trim();
  const isNumericId = /^\d+$/.test(queryParam);

  const url = isNumericId
    ? `${BASE_URL}/transactions/${queryParam}/verify`
    : `${BASE_URL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(queryParam)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  return res.json();
}

/**
 * Resolves / verifies a bank account number against Flutterwave.
 * Returns account holder's registered name.
 */
export async function resolveAccount(
  accountNumber: string,
  bankCode: string
): Promise<FlutterwaveResolveResponse> {
  const secret = getFlwSecretKey();
  if (!secret) {
    throw new Error("Flutterwave secret key is not configured.");
  }

  const res = await fetch(`${BASE_URL}/accounts/resolve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_number: accountNumber.trim(),
      account_bank: bankCode.trim(),
    }),
    signal: AbortSignal.timeout(10000),
  });

  return res.json();
}

/**
 * Retrieves the list of banks for a country from Flutterwave.
 */
export async function listBanks(
  country: string = "NG"
): Promise<FlutterwaveBanksResponse> {
  const secret = getFlwSecretKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) {
    headers["Authorization"] = `Bearer ${secret}`;
  }

  const res = await fetch(`${BASE_URL}/banks/${country}`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(10000),
  });

  return res.json();
}

/**
 * Initiates a bank transfer / payout via Flutterwave.
 */
export async function initiateTransfer(params: {
  accountBank: string;
  accountNumber: string;
  amount: number;
  narration?: string;
  reference?: string;
  currency?: string;
}): Promise<FlutterwaveTransferResponse> {
  const secret = getFlwSecretKey();
  if (!secret) {
    throw new Error("Flutterwave secret key is not configured.");
  }

  const res = await fetch(`${BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_bank: params.accountBank.trim(),
      account_number: params.accountNumber.trim(),
      amount: Math.round(params.amount),
      narration: params.narration || "CampusGo Payout",
      currency: params.currency || "NGN",
      reference:
        params.reference ||
        `cgo_tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      debit_currency: "NGN",
    }),
    signal: AbortSignal.timeout(12000),
  });

  return res.json();
}
