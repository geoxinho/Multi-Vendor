import { NextResponse } from "next/server";

// Comprehensive fallback list of major Nigerian banks
const FALLBACK_BANKS = [
  { name: "Access Bank", code: "044", slug: "access-bank" },
  { name: "Access Bank (Diamond)", code: "063", slug: "access-bank-diamond" },
  { name: "ALAT by WEMA", code: "035A", slug: "alat-by-wema" },
  { name: "Carbon", code: "565", slug: "carbon" },
  { name: "Ecobank Nigeria", code: "050", slug: "ecobank-nigeria" },
  { name: "FairMoney Microfinance Bank", code: "51318", slug: "fairmoney-microfinance-bank" },
  { name: "Fidelity Bank", code: "070", slug: "fidelity-bank" },
  { name: "First Bank of Nigeria", code: "011", slug: "first-bank-of-nigeria" },
  { name: "First City Monument Bank (FCMB)", code: "214", slug: "first-city-monument-bank" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058", slug: "guaranty-trust-bank" },
  { name: "Heritage Bank", code: "030", slug: "heritage-bank" },
  { name: "Jaiz Bank", code: "301", slug: "jaiz-bank" },
  { name: "Kuda Bank", code: "50211", slug: "kuda-bank" },
  { name: "Moniepoint Microfinance Bank", code: "50515", slug: "moniepoint-microfinance-bank-ng" },
  { name: "OPay Digital Services", code: "999992", slug: "opay-digital-services" },
  { name: "PalmPay", code: "999991", slug: "palmpay" },
  { name: "Polaris Bank", code: "076", slug: "polaris-bank" },
  { name: "Providus Bank", code: "101", slug: "providus-bank" },
  { name: "Rubies MFB", code: "125", slug: "rubies-mfb" },
  { name: "Stanbic IBTC Bank", code: "221", slug: "stanbic-ibtc-bank" },
  { name: "Standard Chartered Bank", code: "068", slug: "standard-chartered-bank" },
  { name: "Sterling Bank", code: "232", slug: "sterling-bank" },
  { name: "SunTrust Bank", code: "100", slug: "suntrust-bank" },
  { name: "TAJ Bank", code: "302", slug: "taj-bank" },
  { name: "Titan Trust Bank", code: "102", slug: "titan-trust-bank" },
  { name: "United Bank for Africa (UBA)", code: "033", slug: "united-bank-for-africa" },
  { name: "Unity Bank", code: "215", slug: "unity-bank" },
  { name: "VFD Microfinance Bank", code: "566", slug: "vfd-microfinance-bank" },
  { name: "Wema Bank", code: "035", slug: "wema-bank" },
  { name: "Zenith Bank", code: "057", slug: "zenith-bank" },
];

let cachedBanks: unknown[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function GET() {
  try {
    const now = Date.now();

    if (cachedBanks && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json({ banks: cachedBanks });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || secret.includes("REPLACE_WITH_YOUR")) {
      cachedBanks = FALLBACK_BANKS;
      cacheTimestamp = now;
      return NextResponse.json({ banks: FALLBACK_BANKS });
    }

    try {
      const res = await fetch("https://api.paystack.co/bank?currency=NGN&perPage=100", {
        headers: { Authorization: `Bearer ${secret}` },
        next: { revalidate: 21600 },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.status && Array.isArray(json.data) && json.data.length > 0) {
          const banks = json.data.map(
            (b: { name: string; code: string; slug: string }) => ({
              name: b.name,
              code: b.code,
              slug: b.slug,
            })
          );
          cachedBanks = banks;
          cacheTimestamp = now;
          return NextResponse.json({ banks });
        }
      }
    } catch (err) {
      console.warn("[BANKS API] Paystack fetch failed, using fallback list:", err);
    }

    // Fallback to static bank list on any error or missing data
    cachedBanks = FALLBACK_BANKS;
    cacheTimestamp = now;
    return NextResponse.json({ banks: FALLBACK_BANKS });
  } catch (err) {
    console.error("[BANKS GET]", err);
    return NextResponse.json({ banks: FALLBACK_BANKS });
  }
}
