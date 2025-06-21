console.log('Starting student addition script...');

const mongoose = require('mongoose');
const Student = require('./models/Student');

console.log('Modules loaded successfully');

const studentsData = [
  {
    studentId: '31063405638',
    firstName: 'AHMED',
    lastName: 'ALI A A AL-LENQAWI',
    email: 'ahmed.ali.31063405638@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 9, 17),
    parentContact: {
      fatherName: 'ALI AL-LENQAWI',
      motherName: 'FATIMA AL-LENQAWI',
      phoneNumber: '+97430123001',
      email: 'parent.ahmed.31063405638@gmail.com'
    },
    address: {
      street: '123 Doha Street',
      city: 'Doha',
      postalCode: '12345'
    },
    medicalInfo: {
      bloodType: 'O+',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.5,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '31063405109',
    firstName: 'TAMEEM',
    lastName: 'A.HAKEEM A A BA-NOAMAN',
    email: 'tameem.hakeem.31063405109@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 8, 30),
    parentContact: {
      fatherName: 'HAKEEM BA-NOAMAN',
      motherName: 'AISHA BA-NOAMAN',
      phoneNumber: '+97430123002',
      email: 'parent.tameem.31063405109@gmail.com'
    },
    address: {
      street: '124 Doha Street',
      city: 'Doha',
      postalCode: '12346'
    },
    medicalInfo: {
      bloodType: 'A+',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.7,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '31063401274',
    firstName: 'HASSEN',
    lastName: 'KHALID H A AL-KUWARI',
    email: 'hassen.khalid.31063401274@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 2, 15),
    parentContact: {
      fatherName: 'KHALID AL-KUWARI',
      motherName: 'MARYAM AL-KUWARI',
      phoneNumber: '+97430123003',
      email: 'parent.hassen.31063401274@gmail.com'
    },
    address: {
      street: '125 Doha Street',
      city: 'Al Rayyan',
      postalCode: '12347'
    },
    medicalInfo: {
      bloodType: 'B+',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.3,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  }
];

async function addStudentsWithLogging() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected to MongoDB successfully');

    console.log(`📝 Preparing to add ${studentsData.length} students...`);
    
    for (let i = 0; i < studentsData.length; i++) {
      const studentData = studentsData[i];
      console.log(`\n${i + 1}. Processing: ${studentData.firstName} ${studentData.lastName}`);
      
      try {
        // Check if student already exists
        const existing = await Student.findOne({ studentId: studentData.studentId });
        if (existing) {
          console.log(`   ⚠️  Student ${studentData.studentId} already exists`);
          continue;
        }
        
        // Create new student
        const newStudent = new Student(studentData);
        await newStudent.save();
        console.log(`   ✅ Added: ${studentData.firstName} ${studentData.lastName} (${studentData.studentId})`);
        
      } catch (studentError) {
        console.log(`   ❌ Error adding student: ${studentError.message}`);
      }
    }
    
    // Verify the additions
    console.log('\n📊 Verification:');
    const totalCount = await Student.countDocuments();
    const qatarStudents = await Student.find({ studentId: /^31063/ });
    console.log(`Total students in database: ${totalCount}`);
    console.log(`Qatar National ID students: ${qatarStudents.length}`);
    
    if (qatarStudents.length > 0) {
      console.log('\n🎓 Added Qatar students:');
      qatarStudents.forEach((student, idx) => {
        console.log(`${idx + 1}. ${student.firstName} ${student.lastName} (${student.studentId}) - Grade ${student.grade}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in main function:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('\n🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

console.log('🚀 Starting the addition process...');
addStudentsWithLogging();
