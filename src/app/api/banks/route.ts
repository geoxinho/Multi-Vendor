import { NextResponse } from "next/server";

// Simple in-memory cache: refresh every 6 hours
let cachedBanks: unknown[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * GET /api/banks
 * Fetches and caches the list of all Nigerian banks from Paystack.
 * The Paystack secret key is used only here on the server — never exposed to the client.
 */
export async function GET() {
  try {
    const now = Date.now();

    // Return cached list if still fresh
    if (cachedBanks && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json({ banks: cachedBanks });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 503 }
      );
    }

    const res = await fetch(
      "https://api.paystack.co/bank?currency=NGN&perPage=100",
      {
        headers: { Authorization: `Bearer ${secret}` },
        // Next.js fetch cache — revalidate every 6 hours
        next: { revalidate: 21600 },
      }
    );

    if (!res.ok) {
      console.error("[BANKS] Paystack returned", res.status);
      return NextResponse.json(
        { error: "Unable to fetch bank list. Please try again." },
        { status: 502 }
      );
    }

    const json = await res.json();
    if (!json.status || !Array.isArray(json.data)) {
      return NextResponse.json(
        { error: "Unexpected response from payment provider." },
        { status: 502 }
      );
    }

    // Only expose the fields the frontend needs
    const banks = (json.data as { name: string; code: string; slug: string }[]).map(
      (b) => ({ name: b.name, code: b.code, slug: b.slug })
    );

    cachedBanks = banks;
    cacheTimestamp = now;

    return NextResponse.json({ banks });
  } catch (err) {
    console.error("[BANKS]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
