import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Order } from "@/models/Order";

export type AudienceType = "all" | "buyers" | "sellers" | "abandoned_cart" | "inactive" | "custom";

export async function getAudienceEmails(
  audience: AudienceType,
  customEmailsString?: string
): Promise<{ emails: string[]; label: string }> {
  await connectDB();

  if (audience === "custom") {
    if (!customEmailsString) return { emails: [], label: "Custom Email List" };
    const rawList = customEmailsString
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const uniqueEmails = Array.from(new Set(rawList));
    return { emails: uniqueEmails, label: `Custom Email List (${uniqueEmails.length} addresses)` };
  }

  if (audience === "all") {
    const users = await User.find({ email: { $exists: true, $ne: "" }, isBanned: false })
      .select("email")
      .lean();
    const emails = Array.from(new Set(users.map((u) => u.email.toLowerCase())));
    return { emails, label: "All Users" };
  }

  if (audience === "buyers") {
    const users = await User.find({
      role: "buyer",
      email: { $exists: true, $ne: "" },
      isBanned: false,
    })
      .select("email")
      .lean();
    const emails = Array.from(new Set(users.map((u) => u.email.toLowerCase())));
    return { emails, label: "All Buyers" };
  }

  if (audience === "sellers") {
    const users = await User.find({
      role: "seller",
      email: { $exists: true, $ne: "" },
      isBanned: false,
    })
      .select("email")
      .lean();
    const emails = Array.from(new Set(users.map((u) => u.email.toLowerCase())));
    return { emails, label: "All Sellers" };
  }

  if (audience === "abandoned_cart") {
    // 1. Users with pending or failed orders
    const pendingOrders = await Order.find({ paymentStatus: { $in: ["pending", "failed"] } })
      .select("buyer")
      .lean();
    const pendingBuyerIds = pendingOrders.map((o) => o.buyer.toString());

    // 2. Users with completed paid orders
    const paidOrders = await Order.find({ paymentStatus: "paid" })
      .select("buyer")
      .lean();
    const paidBuyerIds = new Set(paidOrders.map((o) => o.buyer.toString()));

    // 3. All buyers registered who have no paid orders OR have a pending/failed order
    const allBuyers = await User.find({
      role: "buyer",
      email: { $exists: true, $ne: "" },
      isBanned: false,
    })
      .select("_id email")
      .lean();

    const targetEmails = allBuyers
      .filter((u) => {
        const userId = u._id.toString();
        const hasPendingOrder = pendingBuyerIds.includes(userId);
        const hasNoPaidOrder = !paidBuyerIds.has(userId);
        return hasPendingOrder || hasNoPaidOrder;
      })
      .map((u) => u.email.toLowerCase());

    const emails = Array.from(new Set(targetEmails));
    return { emails, label: "Abandoned Cart & Drop-offs" };
  }

  if (audience === "inactive") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get buyers who placed an order in the last 30 days
    const recentOrders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } })
      .select("buyer")
      .lean();
    const recentBuyerIds = new Set(recentOrders.map((o) => o.buyer.toString()));

    // Get users registered over 30 days ago who haven't ordered recently
    const inactiveUsers = await User.find({
      createdAt: { $lt: thirtyDaysAgo },
      email: { $exists: true, $ne: "" },
      isBanned: false,
    })
      .select("_id email")
      .lean();

    const targetEmails = inactiveUsers
      .filter((u) => !recentBuyerIds.has(u._id.toString()))
      .map((u) => u.email.toLowerCase());

    const emails = Array.from(new Set(targetEmails));
    return { emails, label: "Inactive Users (30+ Days)" };
  }

  return { emails: [], label: "Unknown" };
}
