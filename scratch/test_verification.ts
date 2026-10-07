// Loaded via node --env-file=.env.local

import { connectDB } from "../src/lib/db";
import { Product } from "../src/models/Product";
import { Order } from "../src/models/Order";
import { User } from "../src/models/User";
import { getAllActiveSchools, getCampusProductModel, findProductAcrossCampuses } from "../src/lib/campusModels";
import { getFlwSecretKey, getFlwPublicKey, isFlwTestMode } from "../src/lib/flutterwave";
import { getTransporter } from "../src/lib/email";

async function verifyAll() {
  console.log("=== 1. CHECK PAYMENT GATEWAY & ENV KEYS ===");
  console.log("isFlwTestMode():", isFlwTestMode());
  console.log("Flutterwave Public Key:", getFlwPublicKey() ? `${getFlwPublicKey().slice(0, 15)}...` : "NOT FOUND");
  console.log("Flutterwave Secret Key:", getFlwSecretKey() ? `${getFlwSecretKey().slice(0, 15)}...` : "NOT FOUND");

  console.log("\n=== 2. CHECK DATABASE & PRODUCTS LISTING ===");
  await connectDB();
  const schools = await getAllActiveSchools();
  console.log(`Active schools detected: ${schools.map((s) => s.name).join(", ")}`);

  // Query global products
  const globalProducts = await Product.find({ status: "active" }).limit(5).lean();
  console.log(`Global active products count in Product collection: ${globalProducts.length}`);

  // Query campus products
  for (const s of schools) {
    const CampusProduct = getCampusProductModel(s.slug);
    const count = await CampusProduct.countDocuments({ status: "active" });
    console.log(`Campus "${s.name}" active products: ${count}`);
  }

  // Cross-campus product lookup test
  if (globalProducts.length > 0) {
    const firstId = globalProducts[0]._id.toString();
    const found = await findProductAcrossCampuses(firstId);
    console.log(`Cross-campus lookup for "${globalProducts[0].title}":`, found ? "SUCCESS" : "FAILED");
  }

  console.log("\n=== 3. CHECK EMAIL / SMTP TRANSPORTER ===");
  const { transporter, hasSMTP, user, host, port } = getTransporter();
  console.log("SMTP configured:", hasSMTP);
  console.log(`Host: ${host}, Port: ${port}, User: ${user}`);
  if (transporter) {
    try {
      await transporter.verify();
      console.log("SMTP connection verify: SUCCESS (Ready to deliver emails to buyers & sellers)");
    } catch (e: any) {
      console.error("SMTP verify error:", e.message);
    }
  }

  console.log("\n=== ALL SYSTEM CHECKS COMPLETED ===");
  process.exit(0);
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
