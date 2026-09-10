import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/verify-bank
 * Public endpoint for bank account verification during registration.
 * Body: { accountNumber: string; bankCode: string }
 *
 * Falls back gracefully if Paystack is not configured or unavailable.
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { accountNumber, bankCode } = body;

    // Basic validation — bankCode can contain letters, digits, or hyphens
    if (
      typeof accountNumber !== "string" ||
      typeof bankCode !== "string" ||
      !/^\d{10}$/.test(accountNumber.trim()) ||
      bankCode.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid account number or bank code." },
        { status: 400 }
      );
    }

    const secret =
      process.env.FLW_SECRET_KEY ||
      process.env.Secret_Key ||
      process.env.FLUTTERWAVE_SECRET_KEY;

    // ── No Flutterwave key: return manual-entry signal ──────────────────────
    if (!secret) {
      return NextResponse.json(
        { manual: true, message: "Flutterwave not configured — enter account name manually." },
        { status: 200 }
      );
    }

    // ── Live Flutterwave resolve ─────────────────────────────────────────────
    let flwRes: Response;
    let flwJson: Record<string, unknown>;

    try {
      flwRes = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: accountNumber.trim(),
          account_bank: bankCode.trim(),
        }),
        signal: AbortSignal.timeout(10000),
      });
      flwJson = await flwRes.json();
    } catch (networkErr) {
      console.error("[VERIFY BANK] Network/timeout error:", networkErr);
      return NextResponse.json(
        { manual: true, message: "Verification service unreachable — enter account name manually." },
        { status: 200 }
      );
    }

    if (!flwRes.ok || flwJson.status !== "success" || !flwJson.data) {
      const message = (flwJson?.message as string) ?? "";
      console.error("[VERIFY BANK] Flutterwave error:", flwRes.status, message);

      if (flwRes.status === 401) {
        return NextResponse.json(
          { manual: true, message: "Verification service not available — enter account name manually." },
          { status: 200 }
        );
      }
      return NextResponse.json(
        {
          error:
            flwRes.status === 422 ||
            flwRes.status === 400 ||
            message.toLowerCase().includes("not found") ||
            message.toLowerCase().includes("unable to resolve")
              ? "Account not found. Please check the account number and selected bank."
              : "Could not verify account. Please check your details and try again.",
        },
        { status: 422 }
      );
    }

    const data = flwJson.data as { account_name: string; account_number: string };
    return NextResponse.json({
      accountName: data.account_name,
      accountNumber: data.account_number,
    });
  } catch (err) {
    console.error("[VERIFY BANK PUBLIC]", err);
    return NextResponse.json(
      { manual: true, message: "Verification service unavailable — enter account name manually." },
      { status: 200 }
    );
  }
}
