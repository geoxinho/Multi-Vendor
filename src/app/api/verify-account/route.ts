import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Naive in-memory rate limiter: max 5 verifications per userId per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

/**
 * POST /api/verify-account
 * Body: { accountNumber: string; bankCode: string }
 *
 * Verifies a Nigerian bank account via Paystack's resolve endpoint.
 * The secret key never leaves the server.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { accountNumber, bankCode } = body;

    // ── Validation ────────────────────────────────────────────────────
    if (
      typeof accountNumber !== "string" ||
      typeof bankCode !== "string" ||
      !/^\d{10}$/.test(accountNumber.trim()) ||
      !/^[A-Za-z0-9]{1,10}$/.test(bankCode.trim())
    ) {
      return NextResponse.json(
        { error: "Invalid account number or bank code." },
        { status: 400 }
      );
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 503 }
      );
    }

    // ── Call Paystack resolve endpoint ────────────────────────────────
    const paystackRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber.trim()}&bank_code=${bankCode.trim()}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
      }
    );

    const paystackJson = await paystackRes.json();

    if (!paystackRes.ok || !paystackJson.status) {
      // Return a safe generic message — don't forward Paystack internals
      return NextResponse.json(
        {
          error:
            paystackRes.status === 422
              ? "Account not found. Please check the account number and bank."
              : "Unable to verify account at this time. Please try again.",
        },
        { status: 422 }
      );
    }

    const { account_name, account_number } = paystackJson.data;

    return NextResponse.json({
      accountName: account_name,
      accountNumber: account_number,
    });
  } catch (err) {
    console.error("[VERIFY ACCOUNT]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
