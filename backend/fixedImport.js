const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Student = require('./models/Student');

console.log('🏫 Qatar Science and Technology Secondary School');
console.log('📚 Fresh Student Import (Fixed Version)');
console.log('=======================================');

function generateEmail(firstName, lastName, studentId) {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}.${studentId}@qstss.edu.qa`;
}

async function importStudents() {
  try {
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected to database');
    
    // Clear existing students first
    const deleteResult = await Student.deleteMany({});
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing students`);
    
    const students = [];
    let processed = 0;
    
    fs.createReadStream('/Users/ahmadtubaishat/Desktop/website /backend/students.csv')
      .pipe(csv())
      .on('data', (row) => {
        processed++;
        
        // Handle different possible column names
        let studentId = '';
        let name = '';
        let grade = '';
        let className = '';
        
        // Try different variations of the column names
        for (const key in row) {
          if (key.includes('Student ID') || key.includes('ID')) {
            studentId = row[key];
          } else if (key === 'name' || key.includes('name')) {
            name = row[key];
          } else if (key === 'GRADE' || key === 'grade') {
            grade = row[key];
          } else if (key === 'CLASS' || key === 'class') {
            className = row[key];
          }
        }
        
        // Clean the data
        studentId = studentId ? studentId.toString().trim() : '';
        name = name ? name.toString().trim() : '';
        grade = grade ? grade.toString().trim() : '9';
        className = className ? className.toString().trim() : '09/1';
        
        if (studentId && name && studentId !== 'Student ID') {
          const nameParts = name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const student = {
            studentId: studentId,
            firstName: firstName,
            lastName: lastName,
            email: generateEmail(firstName, lastName, studentId),
            grade: grade,
            class: className,
            dateOfBirth: new Date(2010, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            parentContact: {
              fatherName: `${lastName.split(' ').pop() || lastName} (Father)`,
              motherName: `Um ${firstName}`,
              phoneNumber: `+974501${String(30000 + processed).slice(-5)}`,
              email: `parent.${studentId}@qstss.edu.qa`
            },
            address: {
              street: `Building ${100 + processed}, Zone ${Math.floor(processed / 20) + 1}`,
              city: ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor'][processed % 5],
              postalCode: `1${String(5000 + processed).slice(-4)}`
            },
            medicalInfo: {
              bloodType: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'][processed % 8],
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
          
          if (processed <= 5) {
            console.log(`📝 Parsed: ${firstName} ${lastName} (${studentId}) - Grade ${grade}`);
          }
        }
      })
      .on('end', async () => {
        console.log(`\\n📊 Import Summary:`);
        console.log(`   Rows processed: ${processed}`);
        console.log(`   Valid students: ${students.length}`);
        
        if (students.length > 0) {
          try {
            // Import in batches of 50
            const batchSize = 50;
            let imported = 0;
            
            for (let i = 0; i < students.length; i += batchSize) {
              const batch = students.slice(i, i + batchSize);
              const result = await Student.insertMany(batch);
              imported += result.length;
              console.log(`📦 Batch ${Math.floor(i/batchSize) + 1}: Imported ${result.length} students`);
            }
            
            console.log(`\\n✅ Successfully imported ${imported} students!`);
            
            // Verify final count
            const finalCount = await Student.countDocuments();
            console.log(`📊 Total students in database: ${finalCount}`);
            
            // Show grade distribution
            const grades = await Student.aggregate([
              { $group: { _id: '$grade', count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ]);
            
            console.log(`\\n📚 Students by Grade:`);
            grades.forEach(g => {
              console.log(`   Grade ${g._id}: ${g.count} students`);
            });
            
            // Show samples
            console.log(`\\n🎓 Sample students:`);
            const samples = await Student.find({}).limit(8);
            samples.forEach((s, i) => {
              console.log(`   ${i+1}. ${s.firstName} ${s.lastName} (${s.studentId}) - Grade ${s.grade}, Class ${s.class}`);
            });
            
            console.log(`\\n🌐 Access admin panel: http://localhost:5002`);
            console.log(`👨‍💼 Admin login: admin@qstss.edu.qa / admin123`);
            console.log(`\\n🎉 Fresh import completed successfully!`);
            
          } catch (error) {
            console.error('❌ Import failed:', error.message);
          }
        } else {
          console.log('❌ No valid students found in CSV');
        }
        
        mongoose.disconnect();
      })
      .on('error', (error) => {
        console.error('❌ CSV reading error:', error.message);
        mongoose.disconnect();
      });
      
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

importStudents();
