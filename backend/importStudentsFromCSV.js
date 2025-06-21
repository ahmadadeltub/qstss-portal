console.log('🚀 Starting CSV Student Import Script...');

const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Student = require('./models/Student');

console.log('✅ Modules loaded successfully');

// Function to parse date in DD/MM/YYYY format
function parseDate(dateString) {
  if (!dateString) return new Date();
  
  try {
    // Handle format: "17/10/2010 12:00:00 _" or "17/10/2010"
    const datePart = dateString.split(' ')[0];
    const [day, month, year] = datePart.split('/');
    return new Date(year, month - 1, day); // month is 0-indexed
  } catch (error) {
    console.log(`⚠️ Could not parse date: ${dateString}, using default`);
    return new Date();
  }
}

// Function to generate email from name and ID
function generateEmail(firstName, lastName, studentId) {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}.${studentId}@qstss.edu.qa`;
}

// Function to extract names from full name
function extractNames(fullName) {
  const parts = fullName.trim().split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

// Function to generate parent names
function generateParentNames(studentFirstName, lastName) {
  const lastNameParts = lastName.split(' ');
  const familyName = lastNameParts[lastNameParts.length - 1] || lastName;
  
  return {
    fatherName: `Father of ${studentFirstName} ${familyName}`,
    motherName: `Mother of ${studentFirstName} ${familyName}`
  };
}

async function importStudentsFromCSV() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected to MongoDB successfully');

    const csvFilePath = '/Users/ahmadtubaishat/Desktop/website /backend/students.csv';
    
    if (!fs.existsSync(csvFilePath)) {
      console.error('❌ CSV file not found:', csvFilePath);
      return;
    }

    console.log('📄 Reading CSV file:', csvFilePath);
    
    const students = [];
    let lineNumber = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          lineNumber++;
          try {
            // Extract data from CSV row
            const studentId = row['id'] || row['ID'] || '';
            const fullName = row['Students name'] || row['name'] || '';
            const birthDate = row['BD'] || row['birthdate'] || '';
            const age = row['AGE'] || row['age'] || '';
            const grade = row['GRADE'] || row['grade'] || '9';
            const className = row['CLASS'] || row['class'] || '09/1';

            if (!studentId || !fullName) {
              console.log(`⚠️ Line ${lineNumber}: Missing required data - skipping`);
              return;
            }

            // Extract first and last names
            const { firstName, lastName } = extractNames(fullName);
            
            // Generate parent names
            const { fatherName, motherName } = generateParentNames(firstName, lastName);

            // Create student object
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
                phoneNumber: `+974301${String(20000 + lineNumber).slice(-6)}`,
                email: `parent.${studentId.trim()}@qstss.edu.qa`
              },
              address: {
                street: `${100 + lineNumber} Qatar Street`,
                city: ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor'][lineNumber % 5],
                postalCode: `1${String(2000 + lineNumber).slice(-4)}`
              },
              medicalInfo: {
                bloodType: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'][lineNumber % 8],
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
            
            if (lineNumber <= 5) {
              console.log(`📝 Parsed: ${firstName} ${lastName} (ID: ${studentId})`);
            }

          } catch (error) {
            console.error(`❌ Error processing line ${lineNumber}:`, error.message);
          }
        })
        .on('end', async () => {
          try {
            console.log(`\n📊 Parsed ${students.length} students from CSV`);
            
            if (students.length === 0) {
              console.log('❌ No valid students found in CSV');
              resolve(0);
              return;
            }

            // Check current database status
            const existingCount = await Student.countDocuments();
            console.log(`📈 Current students in database: ${existingCount}`);

            // Insert students in batches of 50 to avoid memory issues
            const batchSize = 50;
            let totalInserted = 0;
            let totalSkipped = 0;

            console.log(`\n🔄 Starting batch insertion (${batchSize} students per batch)...\n`);

            for (let i = 0; i < students.length; i += batchSize) {
              const batch = students.slice(i, i + batchSize);
              const batchNumber = Math.floor(i / batchSize) + 1;
              
              console.log(`📦 Processing batch ${batchNumber}: ${batch.length} students`);
              
              try {
                // Insert batch with ordered: false to continue on duplicates
                const result = await Student.insertMany(batch, { ordered: false });
                totalInserted += result.length;
                console.log(`   ✅ Inserted: ${result.length}/${batch.length} students`);
                
              } catch (error) {
                if (error.code === 11000) {
                  // Handle duplicate key errors
                  const duplicateCount = error.writeErrors?.length || 0;
                  const successCount = batch.length - duplicateCount;
                  totalInserted += successCount;
                  totalSkipped += duplicateCount;
                  
                  console.log(`   ⚠️ Batch ${batchNumber}: ${successCount} new, ${duplicateCount} duplicates`);
                  
                  if (duplicateCount > 0) {
                    console.log(`   📝 Duplicate IDs found - students already exist`);
                  }
                } else {
                  console.error(`   ❌ Batch ${batchNumber} error:`, error.message);
                }
              }
            }

            // Final verification
            const finalCount = await Student.countDocuments();
            console.log(`\n🎉 Import Summary:`);
            console.log(`   📥 Students in CSV: ${students.length}`);
            console.log(`   ✅ Successfully imported: ${totalInserted}`);
            console.log(`   ⚠️ Skipped (duplicates): ${totalSkipped}`);
            console.log(`   📊 Total students in database: ${finalCount}`);
            
            if (totalInserted > 0) {
              console.log(`\n🎓 Sample of imported students:`);
              const sampleStudents = await Student.find({}).limit(5);
              sampleStudents.forEach((student, idx) => {
                console.log(`   ${idx + 1}. ${student.firstName} ${student.lastName} (${student.studentId}) - Grade ${student.grade}, Class ${student.class}`);
              });
            }

            resolve(totalInserted);

          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('❌ CSV reading error:', error);
          reject(error);
        });
    });

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  } finally {
    console.log('\n🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the import
async function main() {
  try {
    console.log('🏫 Qatar Science and Technology Secondary School');
    console.log('📚 Student Import System\n');
    
    const importedCount = await importStudentsFromCSV();
    
    if (importedCount > 0) {
      console.log(`\n🎉 SUCCESS! Imported ${importedCount} students successfully!`);
      console.log(`🌐 You can now view them at: http://localhost:5002`);
      console.log(`👨‍💼 Admin login: admin@qstss.edu.qa / admin123`);
    } else {
      console.log(`\n⚠️ No new students were imported. They may already exist in the database.`);
    }
    
  } catch (error) {
    console.error('❌ Import process failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { importStudentsFromCSV };
