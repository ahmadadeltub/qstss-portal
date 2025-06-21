const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('./models/Student');

console.log('🏫 Qatar Science and Technology Secondary School');
console.log('🎯 Complete Student Database Import');
console.log('===================================');

function generateEmail(firstName, lastName, studentId) {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}.${studentId}@qstss.edu.qa`;
}

async function completeImport() {
  try {
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected to database successfully');
    
    // Clear existing students
    const deleteResult = await Student.deleteMany({});
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing students`);
    
    // Read the cleaned student data
    const studentData = fs.readFileSync('/Users/ahmadtubaishat/Desktop/website /backend/students_data.txt', 'utf8');
    const lines = studentData.trim().split('\n').filter(line => line.trim());
    
    console.log(`📄 Found ${lines.length} student records to process`);
    
    const students = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split(',');
      
      if (parts.length >= 4) {
        const studentId = parts[0].trim();
        const fullName = parts[1].trim();
        const grade = parts[2].trim();
        const className = parts[3].trim();
        
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Student';
        
        const student = {
          studentId: studentId,
          firstName: firstName,
          lastName: lastName,
          email: generateEmail(firstName, lastName, studentId),
          grade: grade,
          class: className,
          dateOfBirth: new Date(2008 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          parentContact: {
            fatherName: `${lastName.split(' ').pop() || firstName} (Father)`,
            motherName: `Um ${firstName}`,
            phoneNumber: `+974501${String(30000 + i).slice(-5)}`,
            email: `parent.${studentId}@qstss.edu.qa`
          },
          address: {
            street: `Building ${300 + i}, Sector ${Math.floor(i / 30) + 1}`,
            city: ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor', 'Al Daayen'][i % 6],
            postalCode: `1${String(7000 + i).slice(-4)}`
          },
          medicalInfo: {
            bloodType: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'][i % 8],
            allergies: ['None'],
            medications: 'None'
          },
          academicInfo: {
            previousGrades: {},
            specialNeeds: 'None'
          },
          isActive: true
        };
        
        students.push(student);
        
        // Show progress for first 15 and every 25th student
        if (i < 15 || (i + 1) % 25 === 0) {
          console.log(`📝 ${i + 1}. ${firstName} ${lastName} (${studentId}) - Grade ${grade}, Class ${className}`);
        }
      }
    }
    
    console.log(`\n📊 Successfully parsed ${students.length} students`);
    
    // Import students in batches of 30
    const batchSize = 30;
    let totalImported = 0;
    
    console.log('🚀 Starting batch import...');
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      try {
        const result = await Student.insertMany(batch, { ordered: false });
        totalImported += result.length;
        console.log(`📦 Batch ${batchNum}: ✅ ${result.length}/${batch.length} students imported`);
      } catch (error) {
        console.log(`📦 Batch ${batchNum}: ⚠️ Some issues, but continuing...`);
        // Continue with next batch
      }
    }
    
    // Final verification and statistics
    const finalCount = await Student.countDocuments();
    
    console.log(`\n🎉 IMPORT COMPLETE!`);
    console.log(`================================`);
    console.log(`✅ Total students imported: ${totalImported}`);
    console.log(`📊 Final database count: ${finalCount}`);
    
    // Grade distribution
    const gradeStats = await Student.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log(`\n📚 Students by Grade:`);
    gradeStats.forEach(stat => {
      console.log(`   Grade ${stat._id}: ${stat.count} students`);
    });
    
    // Class distribution for Grade 9
    const grade9Classes = await Student.aggregate([
      { $match: { grade: '9' } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log(`\n🏫 Grade 9 Classes:`);
    grade9Classes.forEach(cls => {
      console.log(`   Class ${cls._id}: ${cls.count} students`);
    });
    
    // Sample students from different grades
    console.log(`\n👥 Sample Students by Grade:`);
    for (const grade of ['9', '10', '11-Engineering', '11-IT', '11-Medical', '12-Engineering', '12-IT', '12-Medical']) {
      const sample = await Student.findOne({ grade: grade });
      if (sample) {
        console.log(`   Grade ${grade}: ${sample.firstName} ${sample.lastName} (${sample.studentId})`);
      }
    }
    
    console.log(`\n🌟 SUCCESS! Qatar Science and Technology Secondary School is ready!`);
    console.log(`🌐 Admin Panel: http://localhost:5002`);
    console.log(`👨‍💼 Login: admin@qstss.edu.qa / admin123`);
    console.log(`📱 All ${finalCount} students are now available in the system!`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

completeImport();
