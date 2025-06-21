const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Student = require('./models/Student');

console.log('📚 Starting CSV import...');

function generateEmail(firstName, lastName, studentId) {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}.${studentId}@qstss.edu.qa`;
}

mongoose.connect('mongodb://localhost:27017/teacher-portal')
  .then(() => {
    console.log('✅ Connected to database');
    
    const students = [];
    let count = 0;
    
    fs.createReadStream('/Users/ahmadtubaishat/Desktop/website /backend/students.csv')
      .pipe(csv())
      .on('data', (row) => {
        count++;
        
        const studentId = (row['Student ID\t'] || row['Student ID'] || '').trim();
        const name = (row['name'] || '').trim();
        const grade = (row['GRADE'] || '9').toString();
        const className = (row['CLASS'] || '09/1').trim();
        
        if (studentId && name) {
          const nameParts = name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');
          
          students.push({
            studentId: studentId,
            firstName: firstName,
            lastName: lastName,
            email: generateEmail(firstName, lastName, studentId),
            grade: grade,
            class: className,
            dateOfBirth: new Date(2010, 5, 15),
            parentContact: {
              fatherName: `Father of ${firstName}`,
              motherName: `Mother of ${firstName}`,
              phoneNumber: `+97450${String(130000 + count).slice(-6)}`,
              email: `parent.${studentId}@qstss.edu.qa`
            },
            address: {
              street: `${count + 100} Qatar Street`,
              city: 'Doha',
              postalCode: '12345'
            },
            medicalInfo: {
              bloodType: 'O+',
              allergies: ['None'],
              medications: 'None'
            },
            academicInfo: {
              previousGrades: {},
              specialNeeds: 'None'
            },
            isActive: true
          });
        }
      })
      .on('end', async () => {
        console.log(`📝 Parsed ${students.length} students from CSV`);
        
        if (students.length > 0) {
          try {
            const result = await Student.insertMany(students);
            console.log(`✅ Successfully imported ${result.length} students!`);
            
            const total = await Student.countDocuments();
            console.log(`📊 Total students in database: ${total}`);
            
            console.log('\\n🎓 Sample imported students:');
            result.slice(0, 5).forEach((s, i) => {
              console.log(`   ${i+1}. ${s.firstName} ${s.lastName} (${s.studentId}) - Grade ${s.grade}`);
            });
            
          } catch (error) {
            console.error('❌ Import error:', error.message);
          }
        }
        
        mongoose.disconnect();
      })
      .on('error', (error) => {
        console.error('❌ CSV error:', error.message);
        mongoose.disconnect();
      });
  })
  .catch(error => {
    console.error('❌ Connection error:', error.message);
  });
