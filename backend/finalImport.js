#!/usr/bin/env node

console.log('🏫 Qatar Science and Technology Secondary School');
console.log('📚 Student Import System');
console.log('=====================================\n');

const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Student = require('./models/Student');

// Parse date from DD/MM/YYYY format
function parseDate(dateString) {
  if (!dateString) return new Date();
  try {
    const datePart = dateString.split(' ')[0];
    const [day, month, year] = datePart.split('/');
    return new Date(year, month - 1, day);
  } catch (error) {
    console.log(`⚠️ Could not parse date: ${dateString}`);
    return new Date();
  }
}

// Generate email from name and ID
function generateEmail(firstName, lastName, studentId) {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}.${studentId}@qstss.edu.qa`;
}

// Extract names from full name
function extractNames(fullName) {
  const parts = fullName.trim().split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

// Generate parent names
function generateParentNames(studentFirstName, lastName) {
  const familyName = lastName.split(' ').pop() || lastName;
  return {
    fatherName: `${familyName} (Father)`,
    motherName: `Um ${studentFirstName}`
  };
}

async function importAllStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected successfully\n');

    const csvPath = '/Users/ahmadtubaishat/Desktop/website /backend/students.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found at:', csvPath);
      return;
    }

    console.log('📄 Reading CSV file...');
    const students = [];
    let processedCount = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          processedCount++;
          
          try {
            const studentId = row['id'] || row['ID'] || '';
            const fullName = row['Students name'] || row['name'] || '';
            const birthDate = row['BD'] || '';
            const grade = row['GRADE'] || '9';
            const className = row['CLASS'] || '09/1';

            if (!studentId || !fullName) {
              console.log(`⚠️ Row ${processedCount}: Missing required data - skipping`);
              return;
            }

            const { firstName, lastName } = extractNames(fullName);
            const { fatherName, motherName } = generateParentNames(firstName, lastName);

            const student = {
              studentId: studentId.trim(),
              firstName: firstName,
              lastName: lastName,
              email: generateEmail(firstName, lastName, studentId.trim()),
              grade: grade.toString(),
              class: className.trim(),
              dateOfBirth: parseDate(birthDate),
              parentContact: {
                fatherName: fatherName,
                motherName: motherName,
                phoneNumber: `+974501${String(30000 + processedCount).slice(-5)}`,
                email: `parent.${studentId.trim()}@qstss.edu.qa`
              },
              address: {
                street: `Building ${100 + processedCount}, Zone ${Math.floor(processedCount / 10) + 1}`,
                city: ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor'][processedCount % 5],
                postalCode: `1${String(5000 + processedCount).slice(-4)}`
              },
              medicalInfo: {
                bloodType: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'][processedCount % 8],
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

          } catch (error) {
            console.error(`❌ Error processing row ${processedCount}:`, error.message);
          }
        })
        .on('end', async () => {
          try {
            console.log(`📝 Processed ${processedCount} rows from CSV`);
            console.log(`✅ Parsed ${students.length} valid students\n`);

            if (students.length === 0) {
              console.log('❌ No valid students found to import');
              resolve(0);
              return;
            }

            // Check existing students
            const existingIds = await Student.find({ 
              studentId: { $in: students.map(s => s.studentId) }
            }).select('studentId');
            
            const existingIdSet = new Set(existingIds.map(s => s.studentId));
            const newStudents = students.filter(s => !existingIdSet.has(s.studentId));

            console.log(`📊 Import Analysis:`);
            console.log(`   Total in CSV: ${students.length}`);
            console.log(`   Already exist: ${existingIds.length}`);
            console.log(`   New to import: ${newStudents.length}\n`);

            if (newStudents.length === 0) {
              console.log('✅ All students from CSV are already in the database!');
              resolve(0);
              return;
            }

            // Import new students in batches
            console.log('🚀 Starting import process...');
            const batchSize = 25;
            let totalImported = 0;

            for (let i = 0; i < newStudents.length; i += batchSize) {
              const batch = newStudents.slice(i, i + batchSize);
              const batchNum = Math.floor(i / batchSize) + 1;
              
              console.log(`📦 Batch ${batchNum}: Importing ${batch.length} students...`);
              
              try {
                const result = await Student.insertMany(batch, { ordered: false });
                totalImported += result.length;
                console.log(`   ✅ Successfully imported ${result.length} students`);
                
                // Show sample of imported students
                batch.slice(0, 3).forEach(s => {
                  console.log(`      • ${s.firstName} ${s.lastName} (${s.studentId})`);
                });
                
              } catch (error) {
                console.error(`   ❌ Batch ${batchNum} error:`, error.message);
              }
            }

            // Final verification
            const finalCount = await Student.countDocuments();
            const qatarCount = await Student.countDocuments({ studentId: /^31[0-9]/ });
            
            console.log(`\n🎉 Import Complete!`);
            console.log(`=====================================`);
            console.log(`✅ New students imported: ${totalImported}`);
            console.log(`📊 Total students in database: ${finalCount}`);
            console.log(`🇶🇦 Qatar National ID students: ${qatarCount}`);
            console.log(`🌐 Access your admin panel: http://localhost:5002`);
            console.log(`👨‍💼 Admin login: admin@qstss.edu.qa / admin123\n`);

            resolve(totalImported);

          } catch (error) {
            console.error('❌ Import process failed:', error.message);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('❌ CSV reading error:', error.message);
          reject(error);
        });
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

// Run the import
importAllStudents()
  .then(async (imported) => {
    if (imported > 0) {
      console.log(`🎊 SUCCESS! Your ${imported} students are now ready!`);
    } else {
      console.log('ℹ️ All students from your CSV are already imported.');
    }
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('💥 Import failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  });
