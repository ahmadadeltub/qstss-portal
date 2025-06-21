#!/usr/bin/env node

console.log('🏫 Qatar Science and Technology Secondary School');
console.log('🔄 Fresh Student Import - Clear & Import');
console.log('==========================================\n');

const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Student = require('./models/Student');

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

// Generate realistic Qatar addresses
function generateAddress(index) {
  const zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
  const cities = ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor'];
  
  return {
    street: `Building ${100 + index}, Street ${Math.floor(index / 10) + 1}, ${zones[index % 5]}`,
    city: cities[index % 5],
    postalCode: `1${String(5000 + index).slice(-4)}`
  };
}

async function clearAndImportStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected successfully\n');

    // Step 1: Clear existing students
    console.log('🗑️ Clearing existing students from database...');
    const deleteResult = await Student.deleteMany({});
    console.log(`✅ Removed ${deleteResult.deletedCount} existing students\n`);

    // Step 2: Read CSV file
    const csvPath = '/Users/ahmadtubaishat/Desktop/website /backend/students.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found at:', csvPath);
      return;
    }

    console.log('📄 Reading fresh CSV file...');
    const students = [];
    let processedCount = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          processedCount++;
          
          try {
            // Handle the CSV format: "Student ID	",name,GRADE,CLASS
            const studentId = (row['Student ID\t'] || row['Student ID'] || row['id'] || '').trim();
            const fullName = (row['name'] || row['Students name'] || '').trim();
            const grade = (row['GRADE'] || row['grade'] || '9').toString();
            const className = (row['CLASS'] || row['class'] || '09/1').trim();

            if (!studentId || !fullName) {
              console.log(`⚠️ Row ${processedCount}: Missing required data - skipping`);
              return;
            }

            const { firstName, lastName } = extractNames(fullName);
            const { fatherName, motherName } = generateParentNames(firstName, lastName);

            const student = {
              studentId: studentId,
              firstName: firstName,
              lastName: lastName,
              email: generateEmail(firstName, lastName, studentId),
              grade: grade,
              class: className,
              dateOfBirth: new Date(2010, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1), // Random date in 2010
              parentContact: {
                fatherName: fatherName,
                motherName: motherName,
                phoneNumber: `+974501${String(30000 + processedCount).slice(-5)}`,
                email: `parent.${studentId}@qstss.edu.qa`
              },
              address: generateAddress(processedCount),
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

            // Show progress every 50 students
            if (processedCount % 50 === 0) {
              console.log(`📝 Processed ${processedCount} rows...`);
            }

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

            // Step 3: Import all students in batches
            console.log('🚀 Starting fresh import process...');
            const batchSize = 50;
            let totalImported = 0;

            for (let i = 0; i < students.length; i += batchSize) {
              const batch = students.slice(i, i + batchSize);
              const batchNum = Math.floor(i / batchSize) + 1;
              
              console.log(`📦 Batch ${batchNum}: Importing ${batch.length} students...`);
              
              try {
                const result = await Student.insertMany(batch, { ordered: true });
                totalImported += result.length;
                console.log(`   ✅ Successfully imported ${result.length} students`);
                
                // Show sample of imported students
                if (batchNum <= 3) {
                  batch.slice(0, 2).forEach(s => {
                    console.log(`      • ${s.firstName} ${s.lastName} (${s.studentId}) - Grade ${s.grade}, Class ${s.class}`);
                  });
                }
                
              } catch (error) {
                console.error(`   ❌ Batch ${batchNum} error:`, error.message);
                // Continue with next batch even if one fails
              }
            }

            // Step 4: Final verification
            const finalCount = await Student.countDocuments();
            
            // Count students by grade
            const gradeCounts = await Student.aggregate([
              { $group: { _id: '$grade', count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ]);

            console.log(`\n🎉 Fresh Import Complete!`);
            console.log(`==========================================`);
            console.log(`✅ Total students imported: ${totalImported}`);
            console.log(`📊 Total students in database: ${finalCount}`);
            console.log(`\n📚 Students by Grade:`);
            gradeCounts.forEach(grade => {
              console.log(`   Grade ${grade._id}: ${grade.count} students`);
            });

            // Show sample of imported students
            console.log(`\n👥 Sample of imported students:`);
            const sampleStudents = await Student.find({}).limit(10);
            sampleStudents.forEach((student, idx) => {
              console.log(`   ${idx + 1}. ${student.firstName} ${student.lastName} (${student.studentId}) - Grade ${student.grade}, Class ${student.class}`);
            });

            console.log(`\n🌐 Access your admin panel: http://localhost:5002`);
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

// Run the clear and import process
async function main() {
  try {
    const importedCount = await clearAndImportStudents();
    
    if (importedCount > 0) {
      console.log(`🎊 SUCCESS! Fresh database with ${importedCount} students is ready!`);
    } else {
      console.log('⚠️ No students were imported.');
    }
    
  } catch (error) {
    console.error('💥 Process failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { clearAndImportStudents };
