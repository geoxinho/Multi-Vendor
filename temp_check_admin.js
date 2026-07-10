const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function checkAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const admins = await mongoose.connection.collection('users').find({ role: 'admin' }).toArray();
  console.log("Admins:", admins.map(u => u.email));
  
  const allUsers = await mongoose.connection.collection('users').find({}).toArray();
  console.log("All users emails:", allUsers.map(u => ({ email: u.email, role: u.role, roles: u.roles })));
  
  mongoose.disconnect();
}

checkAdmin().catch(console.error);
