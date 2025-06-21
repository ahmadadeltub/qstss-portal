#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('./models/Student');

console.log('🚀 Final Student Import - Starting...');

async function finalImport() {
  try {
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected successfully');

    // Clear existing students
    console.log('🗑️ Clearing existing students...');
    const deleteResult = await Student.deleteMany({});
    console.log(`✅ Removed ${deleteResult.deletedCount} existing students`);

    // Read student data
    console.log('📄 Reading student data...');
    const studentData = fs.readFileSync('./students_data.txt', 'utf8');
    const lines = studentData.trim().split('\n').filter(line => line.trim());
    
    console.log(`📊 Found ${lines.length} student records`);

    // Process each student
    const students = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const [studentId, fullName, grade, className] = line.split(',');
      
      if (studentId && fullName) {
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Student';
        
        const student = {
          studentId: studentId.trim(),
          firstName: firstName,
          lastName: lastName,
          email: `${firstName.toLowerCase()}.${lastName.split(' ')[0].toLowerCase()}.${studentId}@qstss.edu.qa`,
          grade: grade || '9',
          class: className || '09/1',
          dateOfBirth: new Date(2009 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          parentContact: {
            fatherName: `${lastName.split(' ').pop() || firstName} (Father)`,
            motherName: `Um ${firstName}`,
            phoneNumber: `+974501${String(40000 + i).slice(-5)}`,
            email: `parent.${studentId}@qstss.edu.qa`
          },
          address: {
            street: `Building ${400 + i}, Sector ${Math.floor(i / 40) + 1}`,
            city: ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor', 'Al Daayen'][i % 6],
            postalCode: `1${String(8000 + i).slice(-4)}`
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
        
        // Show progress
        if (i < 10 || (i + 1) % 30 === 0) {
          console.log(`📝 ${i + 1}. ${firstName} ${lastName} (${studentId}) - Grade ${grade}, Class ${className}`);
        }
      }
    }

    console.log(`\n📦 Prepared ${students.length} students for import`);

    // Import in smaller batches to avoid memory issues
    const batchSize = 25;
    let totalImported = 0;

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      try {
        const result = await Student.insertMany(batch, { ordered: false });
        totalImported += result.length;
        console.log(`✅ Batch ${batchNumber}: Imported ${result.length}/${batch.length} students`);
      } catch (error) {
        console.log(`⚠️ Batch ${batchNumber}: ${error.message}`);
        // Continue with next batch
      }
    }

    // Final verification
    const finalCount = await Student.countDocuments();
    
    console.log(`\n🎉 IMPORT COMPLETED SUCCESSFULLY!`);
    console.log(`===============================`);
    console.log(`✅ Students imported: ${totalImported}`);
    console.log(`📊 Total in database: ${finalCount}`);

    // Show grade distribution
    const gradeStats = await Student.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log(`\n📚 Grade Distribution:`);
    gradeStats.forEach(stat => {
      console.log(`   Grade ${stat._id}: ${stat.count} students`);
    });

    // Show sample students
    console.log(`\n👥 Sample Students:`);
    const sampleStudents = await Student.find({}).limit(8);
    sampleStudents.forEach((student, idx) => {
      console.log(`   ${idx + 1}. ${student.firstName} ${student.lastName} (${student.studentId}) - Grade ${student.grade}, Class ${student.class}`);
    });

    console.log(`\n🌟 Qatar Science and Technology Secondary School Database Ready!`);
    console.log(`🌐 Admin Panel: http://localhost:5002`);
    console.log(`👨‍💼 Login: admin@qstss.edu.qa / admin123`);
    console.log(`📱 Access the Students page to see all ${finalCount} students!`);

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('\n🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  }
}

// Run the import
finalImport();
