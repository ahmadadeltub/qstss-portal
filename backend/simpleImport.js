const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Student = require('./models/Student');

// Simple function to parse date
function parseDate(dateString) {
  if (!dateString) return new Date();
  const datePart = dateString.split(' ')[0];
  const [day, month, year] = datePart.split('/');
  return new Date(year, month - 1, day);
}

// Generate email
function generateEmail(firstName, lastName, studentId) {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}.${studentId}@qstss.edu.qa`;
}

async function main() {
  console.log('🚀 Importing students from CSV...');
  
  try {
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected to database');
    
    const students = [];
    
    fs.createReadStream('/Users/ahmadtubaishat/Desktop/website /backend/students.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (row.id && row['Students name']) {
          const fullName = row['Students name'].trim();
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');
          
          students.push({
            studentId: row.id.trim(),
            firstName: firstName,
            lastName: lastName,
            email: generateEmail(firstName, lastName, row.id.trim()),
            grade: row.GRADE || '9',
            class: row.CLASS || '09/1',
            dateOfBirth: parseDate(row.BD),
            parentContact: {
              fatherName: `Father of ${firstName}`,
              motherName: `Mother of ${firstName}`,
              phoneNumber: `+97430123${String(students.length + 100).slice(-3)}`,
              email: `parent.${row.id}@qstss.edu.qa`
            },
            address: {
              street: `${100 + students.length} Qatar Street`,
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
        console.log(`📝 Parsed ${students.length} students`);
        
        if (students.length > 0) {
          try {
            // Clear existing students first (optional)
            // await Student.deleteMany({});
            
            // Insert new students
            const result = await Student.insertMany(students, { ordered: false });
            console.log(`✅ Successfully added ${result.length} students!`);
          } catch (error) {
            if (error.code === 11000) {
              console.log('⚠️ Some students already exist, but others were added');
            } else {
              console.error('❌ Error:', error.message);
            }
          }
        }
        
        const totalCount = await Student.countDocuments();
        console.log(`📊 Total students in database: ${totalCount}`);
        
        mongoose.disconnect();
      });
      
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
  }
}

main();
