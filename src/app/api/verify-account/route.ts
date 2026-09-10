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

    const secret =
      process.env.FLW_SECRET_KEY ||
      process.env.Secret_Key ||
      process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secret || secret.includes("REPLACE_WITH_YOUR")) {
      return NextResponse.json({
        manual: true,
        message: "Flutterwave key is not configured — enter account name manually.",
      });
    }

    try {
      const flwRes = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
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

      const flwJson = await flwRes.json();

      if (flwRes.ok && flwJson.status === "success" && flwJson.data) {
        const { account_name, account_number } = flwJson.data;
        return NextResponse.json({
          accountName: account_name,
          accountNumber: account_number,
          verifiedByFlutterwave: true,
        });
      }

      if (flwRes.status === 401) {
        return NextResponse.json({
          manual: true,
          message: "Flutterwave secret key is invalid — enter account name manually.",
        });
      }

      // Account not found or could not be resolved
      const msg = flwJson?.message || "";
      return NextResponse.json(
        {
          error:
            flwRes.status === 422 ||
            flwRes.status === 400 ||
            msg.toLowerCase().includes("not found") ||
            msg.toLowerCase().includes("unable to resolve")
              ? "Account not found on selected bank. Please check your account number and bank."
              : `Could not verify account: ${msg || "Check details"}`,
          allowManual: true,
        },
        { status: 422 }
      );
    } catch (netErr) {
      console.warn("[VERIFY ACCOUNT] Flutterwave network/timeout:", netErr);
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
