const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('./models/Student');

console.log('🏫 Qatar Science and Technology Secondary School');
console.log('🔄 Manual CSV Import - Line by Line');
console.log('====================================');

function generateEmail(firstName, lastName, studentId) {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}.${studentId}@qstss.edu.qa`;
}

async function manualImport() {
  try {
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected to database');
    
    // Clear existing students
    const deleteResult = await Student.deleteMany({});
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing students`);
    
    // Read the CSV file manually
    const csvContent = fs.readFileSync('/Users/ahmadtubaishat/Desktop/website /backend/students.csv', 'utf8');
    const lines = csvContent.split('\\n').filter(line => line.trim());
    
    console.log(`📄 Found ${lines.length} lines in CSV`);
    
    const students = [];
    
    // Skip header line and process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by comma, but handle quoted fields
      const parts = line.split(',');
      
      if (parts.length >= 4) {
        const studentId = parts[0].replace(/"/g, '').trim();
        const name = parts[1].replace(/"/g, '').trim();
        const grade = parts[2].replace(/"/g, '').trim();
        const className = parts[3].replace(/"/g, '').trim();
        
        if (studentId && name) {
          const nameParts = name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const student = {
            studentId: studentId,
            firstName: firstName,
            lastName: lastName,
            email: generateEmail(firstName, lastName, studentId),
            grade: grade || '9',
            class: className || '09/1',
            dateOfBirth: new Date(2010, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            parentContact: {
              fatherName: `${lastName.split(' ').pop() || lastName} (Father)`,
              motherName: `Um ${firstName}`,
              phoneNumber: `+974501${String(30000 + i).slice(-5)}`,
              email: `parent.${studentId}@qstss.edu.qa`
            },
            address: {
              street: `Building ${100 + i}, Zone ${Math.floor(i / 20) + 1}`,
              city: ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor'][i % 5],
              postalCode: `1${String(5000 + i).slice(-4)}`
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
          
          if (i <= 10) {
            console.log(`📝 Line ${i}: ${firstName} ${lastName} (${studentId}) - Grade ${grade}, Class ${className}`);
          }
        }
      }
    }
    
    console.log(`\\n📊 Parsed ${students.length} students from CSV`);
    
    if (students.length > 0) {
      try {
        // Import all students
        const result = await Student.insertMany(students);
        console.log(`✅ Successfully imported ${result.length} students!`);
        
        // Verify
        const total = await Student.countDocuments();
        console.log(`📊 Total students in database: ${total}`);
        
        // Grade distribution
        const grades = await Student.aggregate([
          { $group: { _id: '$grade', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]);
        
        console.log(`\\n📚 Students by Grade:`);
        grades.forEach(g => {
          console.log(`   Grade ${g._id}: ${g.count} students`);
        });
        
        // Sample students
        console.log(`\\n🎓 Sample students:`);
        const samples = await Student.find({}).limit(10);
        samples.forEach((s, i) => {
          console.log(`   ${i+1}. ${s.firstName} ${s.lastName} (${s.studentId}) - Grade ${s.grade}, Class ${s.class}`);
        });
        
        console.log(`\\n🎉 SUCCESS! Fresh database with ${result.length} students is ready!`);
        console.log(`🌐 Access: http://localhost:5002`);
        console.log(`👨‍💼 Login: admin@qstss.edu.qa / admin123`);
        
      } catch (error) {
        console.error('❌ Import error:', error.message);
        if (error.writeErrors) {
          console.log('First few errors:');
          error.writeErrors.slice(0, 3).forEach(err => {
            console.log(`  - ${err.err.errmsg}`);
          });
        }
      }
    } else {
      console.log('❌ No students parsed from CSV');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

manualImport();
