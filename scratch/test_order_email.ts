import { connectDB } from "../src/lib/db";
import { Order } from "../src/models/Order";
import { findUsersByIdsAcrossCampuses } from "../src/lib/campusModels";
import { AdminUser } from "../src/models/AdminUser";
import { sendOrderConfirmationEmails } from "../src/utils/email";

async function testOrderEmail() {
  await connectDB();
  const orderId = "6ac655e90041f557d4e8f38e";
  const order = await Order.findById(orderId);
  if (!order) {
    console.error("Order not found");
    return;
  }
  console.log("Found order:", order._id);

  const orderItems = order.items;
  const sellerIds = [
    ...new Set(orderItems.map((item: any) => item.seller.toString())),
  ];

  console.log("Seller IDs:", sellerIds);
  const sellersMap = await findUsersByIdsAcrossCampuses(sellerIds);
  console.log("Sellers map size:", sellersMap.size);

  const sellerItemsMap = new Map<
    string,
    { sellerName?: string; items: typeof orderItems }
  >();
  for (const sellerId of sellerIds) {
    const seller = sellersMap.get(sellerId);
    const email = seller?.email;
    console.log(`Seller ${sellerId}:`, seller?.name, email);
    if (!email) {
      console.warn(`Seller with ID ${sellerId} has no email`);
      continue;
    }
    const items = orderItems.filter(
      (i: any) => i.seller.toString() === sellerId,
    );
    if (items.length > 0) {
      sellerItemsMap.set(email, {
        sellerName: seller.storeName || seller.name || "Seller",
        items,
      });
    }
  }

  const buyerDocMap = await findUsersByIdsAcrossCampuses([order.buyer.toString()]);
  const buyerUser = buyerDocMap.get(order.buyer.toString());
  console.log("Buyer:", buyerUser?.name, buyerUser?.email);

  const buyerEmail = (buyerUser?.email || "").trim();
  const buyerName = buyerUser?.name || "Buyer";

  const adminUsers = await AdminUser.find({ isBanned: { $ne: true } })
    .select("email")
    .lean()
    .catch(() => []);
  const adminEmails: string[] = [
    ...new Set(
      adminUsers
        .map((a: any) => a.email)
        .filter(Boolean)
        .map((email: string) => email.trim())
        .concat(
          process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim()] : [],
        )
        .concat(process.env.SMTP_USER ? [process.env.SMTP_USER.trim()] : [])
        .filter(Boolean)
        .map((email) => email.toLowerCase()),
    ),
  ];

  console.log("Admin emails:", adminEmails);
  console.log("Calling sendOrderConfirmationEmails...");

  await sendOrderConfirmationEmails(
    order,
    buyerEmail,
    buyerName,
    sellerItemsMap,
    adminEmails,
  );

  console.log("sendOrderConfirmationEmails completed!");
  process.exit(0);
}

testOrderEmail().catch((err) => {
  console.error("Test order email error:", err);
  process.exit(1);
});
