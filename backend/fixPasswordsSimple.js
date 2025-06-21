const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('🔧 Starting admin password fix...');

async function fixPasswords() {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected to MongoDB');
    
    // Get all admin users
    const adminUsers = await mongoose.connection.db.collection('teachers').find({
      role: 'admin'
    }).toArray();
    
    console.log(`📋 Found ${adminUsers.length} admin users`);
    
    for (const user of adminUsers) {
      console.log(`\n👤 Processing: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`🔑 Current password: ${user.password}`);
      
      // Check if password is already hashed
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        console.log('✅ Password already hashed, skipping');
        continue;
      }
      
      // Hash the plain text password
      console.log('🔐 Hashing plain text password...');
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      // Update the password
      await mongoose.connection.db.collection('teachers').updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('✅ Password updated successfully!');
      console.log(`📧 Login with: ${user.email} / ${user.password}`);
    }
    
    console.log('\n🎉 All admin passwords have been properly hashed!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('1. admin@qstss.edu.qa / admin123');
    console.log('2. a.tubaishat1704@education.qa / 123456789');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixPasswords();
