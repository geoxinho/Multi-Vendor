const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const uri = envFile.split('\n').find(line => line.startsWith('MONGODB_URI=')).replace('MONGODB_URI=', '').trim();
    
    await mongoose.connect(uri);
    const hashed = await bcrypt.hash('Password123!', 12);
    const result = await mongoose.connection.collection('users').updateOne(
      { email: 'georgex.edg@gmail.com' },
      { $set: { password: hashed, isEmailVerified: true } }
    );
    console.log('User password updated successfully. Modified count:', result.modifiedCount);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
