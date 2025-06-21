const mongoose = require('mongoose');
const Student = require('./models/Student');

console.log('🔄 Starting database clear...');

mongoose.connect('mongodb://localhost:27017/teacher-portal')
  .then(async () => {
    console.log('✅ Connected to database');
    
    const beforeCount = await Student.countDocuments();
    console.log(`📊 Students before clearing: ${beforeCount}`);
    
    const result = await Student.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} students`);
    
    const afterCount = await Student.countDocuments();
    console.log(`📊 Students after clearing: ${afterCount}`);
    
    console.log('✅ Database cleared successfully');
    
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
  });
