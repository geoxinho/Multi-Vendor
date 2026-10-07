import { connectDB } from "../src/lib/db";
import { Order } from "../src/models/Order";
import { findUsersByIdsAcrossCampuses } from "../src/lib/campusModels";

async function checkLastOrder() {
  await connectDB();
  const lastOrders = await Order.find().sort({ createdAt: -1 }).limit(3).lean();
  console.log("Recent orders in DB:", JSON.stringify(lastOrders, null, 2));

  for (const ord of lastOrders) {
    const sellerIds = ord.items.map((i: any) => i.seller?.toString()).filter(Boolean);
    const buyerId = ord.buyer?.toString();
    console.log(`Order ${ord._id}: buyerId=${buyerId}, sellerIds=${sellerIds}`);

    const allUsers = await findUsersByIdsAcrossCampuses([...sellerIds, buyerId]);
    console.log("Found users for this order:");
    for (const [id, u] of allUsers.entries()) {
      console.log(`  ID: ${id} -> email: ${u?.email}, name: ${u?.name}, storeName: ${u?.storeName}, school: ${u?.school}`);
    }
  }

  process.exit(0);
}

checkLastOrder().catch((e) => {
  console.error(e);
  process.exit(1);
});
