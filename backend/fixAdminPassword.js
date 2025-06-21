const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/teacher-portal');

async function fixAdminPassword() {
  try {
    console.log('🔧 Fixing admin user password...');
    
    // Find the admin user with plain text password
    const adminUser = await mongoose.connection.db.collection('teachers').findOne({
      email: 'a.tubaishat1704@education.qa'
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('📋 Found admin user:', adminUser.firstName, adminUser.lastName);
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Current password:', adminUser.password);
    
    // Check if password is already hashed
    if (adminUser.password.startsWith('$2b$') || adminUser.password.startsWith('$2a$')) {
      console.log('✅ Password is already hashed, no action needed');
      return;
    }
    
    // Hash the plain text password
    console.log('🔐 Hashing plain text password...');
    const hashedPassword = await bcrypt.hash(adminUser.password, 12);
    
    // Update the user with hashed password
    await mongoose.connection.db.collection('teachers').updateOne(
      { _id: adminUser._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Password updated successfully!');
    console.log('🔑 New hashed password:', hashedPassword);
    console.log('');
    console.log('🎯 You can now login with:');
    console.log('📧 Email: a.tubaishat1704@education.qa');
    console.log('🔑 Password: 123456789');
    
  } catch (error) {
    console.error('❌ Error fixing password:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Also fix the first admin user if needed and set standard password
async function ensureStandardAdminPasswords() {
  try {
    console.log('🔧 Ensuring standard admin passwords...');
    
    // Set standard password for the main admin
    const mainAdmin = await mongoose.connection.db.collection('teachers').findOne({
      email: 'admin@qstss.edu.qa'
    });
    
    if (mainAdmin) {
      const standardPassword = 'admin123';
      const hashedStandardPassword = await bcrypt.hash(standardPassword, 12);
      
      await mongoose.connection.db.collection('teachers').updateOne(
        { _id: mainAdmin._id },
        { $set: { password: hashedStandardPassword } }
      );
      
      console.log('✅ Standard admin password set');
      console.log('📧 Email: admin@qstss.edu.qa');
      console.log('🔑 Password: admin123');
    }
    
  } catch (error) {
    console.error('❌ Error setting standard passwords:', error);
  }
}

async function main() {
  await fixAdminPassword();
  await ensureStandardAdminPasswords();
  
  console.log('');
  console.log('🎉 Password fix complete! You can now login with either:');
  console.log('1. admin@qstss.edu.qa / admin123');
  console.log('2. a.tubaishat1704@education.qa / 123456789');
}

main();
