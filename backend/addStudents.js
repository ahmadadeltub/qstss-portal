const mongoose = require('mongoose');
const Student = require('./models/Student');
require('dotenv').config();

// Function to parse Qatar date format and convert to Date object
function parseQatarDate(dateString) {
  // Remove Arabic AM/PM indicators and parse the date
  const cleanDate = dateString.replace(' 12:00:00 ص', '').replace(' 12:00:00 م', '');
  const [day, month, year] = cleanDate.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

// Function to extract first and last names from full Arabic name
function parseArabicName(fullName) {
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || 'Unknown';
  const lastName = nameParts.slice(1).join(' ') || 'Unknown';
  return { firstName, lastName };
}

// Function to generate email from name and student ID
function generateEmail(firstName, lastName, studentId) {
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirstName}.${cleanLastName}.${studentId}@qstss.edu.qa`;
}

// Function to calculate age from birth date
function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Real students data from Qatar Science and Technology Secondary School
const realStudentsData = [
  {
    id: '31063405638',
    name: 'AHMED ALI A A AL-LENQAWI',
    birthDate: '17/10/2010 12:00:00 ص',
    age: 14,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063405109',
    name: 'TAMEEM A.HAKEEM A A BA-NOAMAN',
    birthDate: '30/09/2010 12:00:00 ص',
    age: 14,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063401274',
    name: 'HASSEN KHALID H A AL-KUWARI',
    birthDate: '15/03/2010 12:00:00 ص',
    age: 15,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063407605',
    name: 'HASSAN AQEEL A B AL-KHUZAEI',
    birthDate: '31/12/2010 12:00:00 ص',
    age: 14,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063402225',
    name: 'RASHID AHMED R S NAFWA',
    birthDate: '14/05/2010 12:00:00 ص',
    age: 14,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063403008',
    name: 'SAAD ABDULRAHMAN S H AL-AHBABI',
    birthDate: '16/06/2010 12:00:00 ص',
    age: 14,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31163403555',
    name: 'ABDULAZIZ MOHAMMED A H AL-EMADI',
    birthDate: '03/07/2011 12:00:00 ص',
    age: 13,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063405360',
    name: 'ALI KHALID E G AL-KUBAISI',
    birthDate: '19/09/2010 12:00:00 ص',
    age: 14,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063401951',
    name: 'ESSA ABDULRAHMAN A A ZYARA',
    birthDate: '25/04/2010 12:00:00 ص',
    age: 14,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063406096',
    name: 'GHANIM ABDULAZIZ J K AL-HAJAJI',
    birthDate: '11/11/2010 12:00:00 ص',
    age: 14,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063407149',
    name: 'FADUL KHALID O M ALNAIMI',
    birthDate: '21/12/2010 12:00:00 ص',
    age: 14,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31163402014',
    name: 'MOHAMMED GHAREEB M Z AL-ABSI',
    birthDate: '14/04/2011 12:00:00 ص',
    age: 13,
    grade: '9',
    class: '09/1'
  },
  {
    id: '30963407440',
    name: 'MOHAMMED MASAAD H A ALKORBI',
    birthDate: '02/12/2009 12:00:00 ص',
    age: 15,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31163402108',
    name: 'NASSER HAMAD N B AHMED',
    birthDate: '01/05/2011 12:00:00 ص',
    age: 13,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31004800006',
    name: 'NASER MOHAMED N A AL-JANAHI',
    birthDate: '12/02/2010 12:00:00 ص',
    age: 15,
    grade: '9',
    class: '09/1'
  },
  {
    id: '31063400298',
    name: 'NASSER MOHAMED N A AL-MOHANNADI',
    birthDate: '02/01/2010 12:00:00 ص',
    age: 15,
    grade: '9',
    class: '09/1'
  }
];

// Function to create student objects compatible with the database schema
function createStudentObjects() {
  return realStudentsData.map((studentData, index) => {
    const { firstName, lastName } = parseArabicName(studentData.name);
    const birthDate = parseQatarDate(studentData.birthDate);
    const email = generateEmail(firstName, lastName, studentData.id);
    
    // Generate some default values for required fields
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const cities = ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah'];
    
    return {
      studentId: studentData.id,
      firstName: firstName,
      lastName: lastName,
      email: email,
      grade: studentData.grade,
      class: studentData.class,
      dateOfBirth: birthDate,
      parentContact: {
        fatherName: `${firstName} Father`,
        motherName: `${firstName} Mother`,
        phoneNumber: `+974${Math.floor(Math.random() * 90000000) + 30000000}`,
        email: `parent.${firstName.toLowerCase()}.${studentData.id}@gmail.com`
      },
      address: {
        street: `${Math.floor(Math.random() * 999) + 1} Qatar Street`,
        city: cities[Math.floor(Math.random() * cities.length)],
        postalCode: `${Math.floor(Math.random() * 90000) + 10000}`
      },
      medicalInfo: {
        bloodType: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
        allergies: ['None'],
        medications: 'None'
      },
      academicInfo: {
        gpa: (Math.random() * 2 + 2).toFixed(2), // GPA between 2.0 and 4.0
        previousGrades: {},
        specialNeeds: 'None'
      },
      isActive: true
    };
  });
}

async function addStudents() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher-portal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB successfully');

    // Create student objects
    const studentsToAdd = createStudentObjects();
    
    console.log(`Preparing to add ${studentsToAdd.length} students...`);
    
    // Check for existing students to avoid duplicates
    const existingStudentIds = await Student.find({
      studentId: { $in: realStudentsData.map(s => s.id) }
    }).select('studentId');
    
    const existingIds = existingStudentIds.map(s => s.studentId);
    const newStudents = studentsToAdd.filter(s => !existingIds.includes(s.studentId));
    
    if (newStudents.length === 0) {
      console.log('All students already exist in the database.');
      return;
    }
    
    console.log(`Adding ${newStudents.length} new students (${existingIds.length} already exist)...`);
    
    // Insert new students
    const insertedStudents = await Student.insertMany(newStudents);
    console.log(`Successfully added ${insertedStudents.length} students to the database`);
    
    // Display summary
    console.log('\n=== Added Students Summary ===');
    insertedStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.firstName} ${student.lastName} (ID: ${student.studentId}) - Grade ${student.grade}, Class ${student.class}`);
    });
    
  } catch (error) {
    console.error('Error adding students:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error - some students may already exist');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the script
addStudents();
