import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    // Basic security for cron: require a secret token in the URL or headers
    // e.g. /api/cron/payouts?token=MY_SECRET_CRON_TOKEN
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    await connectDB();

    // Find all orders that have been delivered, not yet paid to seller, and their release date has passed
    const now = new Date();
    const ordersToProcess = await Order.find({
      deliveryStatus: "delivered",
      sellerPaid: false,
      sellerPayoutReleaseAt: { $lte: now },
    });

    if (ordersToProcess.length === 0) {
      return NextResponse.json({ message: "No payouts pending." });
    }

    const processedOrders = [];
    const failedOrders = [];

    for (const order of ordersToProcess) {
      try {
        // Find seller(s) for the order. For multi-vendor, we process payouts for each seller.
        // We'll iterate through order items and group payouts by seller
        const payoutsBySeller: Record<string, number> = {};
        for (const item of order.items) {
          const sellerId = item.seller.toString();
          if (!payoutsBySeller[sellerId]) {
            payoutsBySeller[sellerId] = 0;
          }
          payoutsBySeller[sellerId] += item.netPayout || 0;
        }

        // Process a transfer for each seller
        for (const [sellerId, amount] of Object.entries(payoutsBySeller)) {
          if (amount <= 0) continue;

          const seller = await User.findById(sellerId);
          if (!seller || !seller.bankDetails || !seller.bankDetails.accountNumber) {
            console.error(`[PAYOUT CRON] Seller ${sellerId} has incomplete bank details`);
            continue; // Cannot pay this seller
          }

          try {
            const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
            if (!paystackSecret || paystackSecret.includes("xxx")) {
              console.log(`[PAYOUT MOCK] Paying ₦${amount} to Seller ${seller.name} (${seller.bankDetails.accountNumber})`);
              continue; // Skip actual Paystack call in dev if not configured
            }

            // 1. Create Transfer Recipient
            const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
              method: "POST",
              headers: { 
                Authorization: `Bearer ${paystackSecret}`, 
                "Content-Type": "application/json" 
              },
              body: JSON.stringify({
                type: "nuban",
                name: seller.bankDetails.accountName,
                account_number: seller.bankDetails.accountNumber,
                bank_code: seller.bankDetails.bankName,
                currency: "NGN"
              })
            });
            const recipientData = await recipientRes.json();
            
            if (!recipientData.status) {
              console.error(`[PAYOUT PAYSTACK ERROR] Recipient creation failed:`, recipientData.message);
              continue;
            }

            const recipientCode = recipientData.data.recipient_code;

            // 2. Initiate Transfer
            const transferRes = await fetch("https://api.paystack.co/transfer", {
              method: "POST",
              headers: { 
                Authorization: `Bearer ${paystackSecret}`, 
                "Content-Type": "application/json" 
              },
              body: JSON.stringify({
                source: "balance",
                amount: amount * 100, // Kobo
                recipient: recipientCode,
                reason: `Payout for order ${order._id}`
              })
            });
            const transferData = await transferRes.json();
            
            if (!transferData.status) {
              console.error(`[PAYOUT PAYSTACK ERROR] Transfer failed:`, transferData.message);
              continue;
            }

            console.log(`[PAYOUT SUCCESS] Paid ₦${amount} to Seller ${seller.name}`);
          } catch (payoutErr) {
            console.error(`[PAYOUT FAIL] Error paying seller ${sellerId}:`, payoutErr);
          }
        }

        // Mark the entire order as sellerPaid=true
        order.sellerPaid = true;
        await order.save();
        processedOrders.push(order._id);
      } catch (err) {
        console.error(`[PAYOUT CRON] Error processing order ${order._id}:`, err);
        failedOrders.push(order._id);
      }
    }

    return NextResponse.json({
      message: "Payouts processed",
      processed: processedOrders.length,
      failed: failedOrders.length,
    });
  } catch (err) {
    console.error("[PAYOUT CRON GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
