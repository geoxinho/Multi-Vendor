import { connectDB } from "./src/lib/db";
import { User } from "./src/models/User";
import bcrypt from "bcryptjs";

async function createAdmin() {
  await connectDB();
  
  const adminEmail = "admin@markethub.com";
  const existing = await User.findOne({ email: adminEmail });
  
  if (existing) {
    console.log("Admin already exists!");
    process.exit(0);
  }
  
  const hashedPassword = await bcrypt.hash("Admin123!", 10);
  
  await User.create({
    name: "System Admin",
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
    roles: ["admin"],
    isEmailVerified: true
  });
  
  console.log("Admin created successfully!");
  process.exit(0);
}

createAdmin().catch(console.error);
