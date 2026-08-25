import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getSellerWalletData } from "@/lib/sellerWallet";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { Withdrawal } from "@/models/Withdrawal";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 });
    }

    await connectDB();
    const sellerId = session.user.id;

    const seller = await User.findById(sellerId);
    if (!seller) {
      return NextResponse.json({ error: "Seller account not found" }, { status: 404 });
    }

    if (
      !seller.bankDetails ||
      !seller.bankDetails.accountNumber ||
      !seller.bankDetails.bankName ||
      !seller.bankDetails.accountName
    ) {
      return NextResponse.json(
        {
          error:
            "Bank details missing. Please add your Bank Name, Account Number, and Account Name in Seller Settings first.",
        },
        { status: 400 }
      );
    }

    // Check available balance
    const wallet = await getSellerWalletData(sellerId);

    if (withdrawAmount > wallet.availableBalance) {
      return NextResponse.json(
        {
          error: `Insufficient available balance. You can withdraw up to ₦${wallet.availableBalance.toLocaleString()}. (Note: Earnings from recent orders are locked for 24 hours after delivery).`,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Find eligible released & unheld orders for this seller to mark as paid out
    const eligibleOrders = await Order.find({
      "items.seller": sellerId,
      deliveryStatus: "delivered",
      paymentStatus: "paid",
      sellerPaid: { $ne: true },
      payoutHeld: { $ne: true },
      sellerPayoutReleaseAt: { $lte: now },
    });

    let accumulatedNet = 0;
    const ordersToMarkPaid = [];

    for (const order of eligibleOrders) {
      if (accumulatedNet >= withdrawAmount) break;

      const sellerItems = order.items.filter((i: any) => i.seller?.toString() === sellerId);
      const net = sellerItems.reduce(
        (sum: number, i: any) => sum + (i.netPayout ?? i.price * i.quantity * 0.95),
        0
      );

      accumulatedNet += net;
      ordersToMarkPaid.push(order);
    }

    // Paystack Transfer if secret key configured
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    let paystackRef = "";

    if (paystackSecret && !paystackSecret.includes("xxx") && paystackSecret.trim() !== "") {
      try {
        const bankCode = seller.bankDetails.bankCode || seller.bankDetails.bankName;

        // 1. Create recipient
        const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "nuban",
            name: seller.bankDetails.accountName,
            account_number: seller.bankDetails.accountNumber,
            bank_code: bankCode,
            currency: "NGN",
          }),
        });
        const recipientData = await recipientRes.json();

        if (recipientData.status) {
          const recipientCode = recipientData.data.recipient_code;
          // 2. Transfer
          const transferRes = await fetch("https://api.paystack.co/transfer", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source: "balance",
              amount: Math.round(withdrawAmount * 100),
              recipient: recipientCode,
              reason: `CampusGo Seller Withdrawal for ${seller.name}`,
            }),
          });
          const transferData = await transferRes.json();
          if (transferData.status) {
            paystackRef = transferData.data.reference || transferData.data.transfer_code || "";
          }
        }
      } catch (paystackErr) {
        console.error("[WITHDRAW PAYSTACK ERROR]", paystackErr);
      }
    }

    // Record Withdrawal in DB
    const withdrawal = await Withdrawal.create({
      seller: sellerId,
      amount: withdrawAmount,
      bankDetails: {
        bankName: seller.bankDetails.bankName,
        bankCode: seller.bankDetails.bankCode || "",
        accountNumber: seller.bankDetails.accountNumber,
        accountName: seller.bankDetails.accountName,
      },
      status: "completed",
      reference: paystackRef,
      processedAt: new Date(),
    });

    // Mark corresponding orders as paid out
    for (const order of ordersToMarkPaid) {
      order.sellerPaid = true;
      await order.save();
    }

    // Send confirmation email to seller
    try {
      await sendMail({
        to: seller.email,
        subject: "💰 Withdrawal Successful – CampusGo Wallet",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background: linear-gradient(135deg, #A4860E, #c9a72a); padding: 32px 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900;">💰 Withdrawal Disbursed!</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Funds sent to your bank account</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #111827; font-size: 15px; margin: 0 0 16px;">Hi <strong>${seller.storeName || seller.name}</strong> 👋,</p>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Your withdrawal request of <strong>₦${withdrawAmount.toLocaleString()}</strong> from your CampusGo Seller Wallet has been processed and sent to your bank account!
              </p>
              <div style="background: #fdf8e8; border: 1px solid #e8d48a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; margin: 0 0 10px;">Withdrawal Details</p>
                <p style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px;">₦${withdrawAmount.toLocaleString()}</p>
                <p style="font-size: 13px; color: #6b7280; margin: 0;">Bank: <strong>${seller.bankDetails.bankName}</strong></p>
                <p style="font-size: 13px; color: #6b7280; margin: 2px 0 0;">Account: <strong>${seller.bankDetails.accountName} (${seller.bankDetails.accountNumber})</strong></p>
              </div>
              <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
                Depending on your bank, funds will reflect in your account shortly. Thank you for selling on CampusGo!
              </p>
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://campusgo.vercel.app"}/dashboard/seller/payouts"
                  style="display: inline-block; background: #A4860E; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
                  View Wallet &amp; Payouts
                </a>
              </div>
            </div>
            <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">CampusGo · Adeleke University Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("[WITHDRAW EMAIL ERROR]", emailErr);
    }

    return NextResponse.json({
      message: `Successfully withdrew ₦${withdrawAmount.toLocaleString()} to your bank account!`,
      withdrawal,
      availableBalance: Math.max(0, wallet.availableBalance - withdrawAmount),
    });
  } catch (err) {
    console.error("[SELLER WITHDRAW POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
