const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function run() {
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const uri = envFile.split('\n').find(line => line.startsWith('MONGODB_URI=')).replace('MONGODB_URI=', '').trim();
    await mongoose.connect(uri);

    const hashed = await bcrypt.hash('Password123!', 12);
    const user = await User.findOneAndUpdate(
      { email: 'georgex.edg@gmail.com' },
      { $set: { password: hashed, isEmailVerified: true } },
      { new: true }
    );
    
    if (user) {
      console.log('User updated using Mongoose.');
      console.log('Verified:', user.get('isEmailVerified'));
      const isMatch = await bcrypt.compare('Password123!', user.get('password'));
      console.log('Match test:', isMatch);
    } else {
      console.log('User not found during update!');
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
