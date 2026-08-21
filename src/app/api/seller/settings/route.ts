import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name || "",
      phone: user.phone || "",
      storeName: user.storeName || "",
      storeDescription: user.storeDescription || "",
      lastBrandNameChangeAt: user.lastBrandNameChangeAt || null,
      lastNameChangeAt: user.lastNameChangeAt || null,
      bankDetails: user.bankDetails
        ? {
            bankName: user.bankDetails.bankName || "",
            bankCode: (user.bankDetails as unknown as { bankCode?: string }).bankCode || "",
            accountNumber: user.bankDetails.accountNumber || "",
            accountName: user.bankDetails.accountName || "",
          }
        : undefined,
    });
  } catch (error) {
    console.error("GET Seller Settings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, storeName, storeDescription, bankDetails } = body;

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Bank details update ─────────────────────────────────────────
    if (bankDetails) {
      const { bankName, bankCode, accountNumber, accountName } = bankDetails;

      // Basic server-side sanity check (real verification already happened
      // via /api/verify-account before the client submitted this)
      if (
        !bankName ||
        !bankCode ||
        typeof accountNumber !== "string" ||
        !/^\d{10}$/.test(accountNumber) ||
        !accountName
      ) {
        return NextResponse.json(
          { error: "Invalid bank details. Please verify your account first." },
          { status: 400 }
        );
      }

      user.bankDetails = {
        bankName,
        accountNumber,
        accountName,
        ...(user.bankDetails as unknown as object),
      };
      // Mongoose doesn't pick up nested changes automatically — use set
      user.set("bankDetails.bankName", bankName);
      user.set("bankDetails.bankCode", bankCode);
      user.set("bankDetails.accountNumber", accountNumber);
      user.set("bankDetails.accountName", accountName);

      await user.save();
      return NextResponse.json({ message: "Bank details saved successfully" });
    }

    // ── Brand / Store name update (once per year) ───────────────────
    if (storeName && storeName !== user.storeName) {
      const now = new Date();
      if (user.lastBrandNameChangeAt) {
        const lastChange = new Date(user.lastBrandNameChangeAt);
        const daysSinceChange =
          (now.getTime() - lastChange.getTime()) / (1000 * 3600 * 24);
        if (daysSinceChange < 365) {
          const daysLeft = Math.ceil(365 - daysSinceChange);
          return NextResponse.json(
            {
              error: `You can only change your brand name once a year. Please wait ${daysLeft} more days.`,
            },
            { status: 400 }
          );
        }
      }
      user.storeName = storeName;
      user.lastBrandNameChangeAt = now;
    }

    // ── Phone & description (unrestricted) ─────────────────────────
    if (phone !== undefined) user.phone = phone.trim();
    if (storeDescription !== undefined) user.storeDescription = storeDescription;

    await user.save();
    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("PUT Seller Settings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
