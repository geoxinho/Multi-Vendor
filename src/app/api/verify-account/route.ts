import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

/**
 * POST /api/verify-account
 * Body: { accountNumber: string; bankCode: string }
 *
 * Verifies a Nigerian bank account via Paystack's resolve endpoint.
 * Falls back gracefully to manual account name entry if Paystack key is missing, invalid, or unreachable.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { accountNumber, bankCode } = body;

    if (
      typeof accountNumber !== "string" ||
      typeof bankCode !== "string" ||
      !/^\d{10}$/.test(accountNumber.trim()) ||
      !/^[A-Za-z0-9-]{1,10}$/.test(bankCode.trim())
    ) {
      return NextResponse.json(
        { error: "Invalid account number or bank code." },
        { status: 400 }
      );
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || secret.includes("REPLACE_WITH_YOUR")) {
      return NextResponse.json({
        manual: true,
        message: "Paystack live key is not configured — enter account name manually.",
      });
    }

    try {
      const paystackRes = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber.trim()}&bank_code=${bankCode.trim()}`,
        {
          headers: { Authorization: `Bearer ${secret}` },
          signal: AbortSignal.timeout(8000),
        }
      );

      const paystackJson = await paystackRes.json();

      if (paystackRes.ok && paystackJson.status && paystackJson.data) {
        const { account_name, account_number } = paystackJson.data;
        return NextResponse.json({
          accountName: account_name,
          accountNumber: account_number,
          verifiedByPaystack: true,
        });
      }

      if (paystackRes.status === 401) {
        return NextResponse.json({
          manual: true,
          message: "Paystack secret key is invalid — enter account name manually.",
        });
      }

      // Account not found on Paystack
      return NextResponse.json(
        {
          error:
            paystackRes.status === 422 || paystackJson.message?.toLowerCase().includes("not found")
              ? "Account not found on selected bank. Please check your details."
              : "Could not auto-verify account.",
          allowManual: true,
        },
        { status: 422 }
      );
    } catch (netErr) {
      console.warn("[VERIFY ACCOUNT] Paystack network/timeout:", netErr);
      return NextResponse.json({
        manual: true,
        message: "Verification service unreachable — enter account name manually.",
      });
    }
  } catch (err) {
    console.error("[VERIFY ACCOUNT]", err);
    return NextResponse.json({
      manual: true,
      message: "An unexpected error occurred — enter account name manually.",
    });
  }
}
