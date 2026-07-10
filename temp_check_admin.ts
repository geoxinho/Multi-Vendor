import { connectDB } from "./src/lib/db";
import { User } from "./src/models/User";

async function checkAdmin() {
  await connectDB();
  const admins = await User.find({ $or: [{ role: 'admin' }, { roles: 'admin' }] }).lean();
  console.log("Admins:", admins.map(u => u.email));
  process.exit(0);
}

checkAdmin().catch(console.error);
