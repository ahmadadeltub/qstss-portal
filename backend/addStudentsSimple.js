const mongoose = require('mongoose');
const Student = require('./models/Student');

// Real students data to add
const studentsToAdd = [
  {
    studentId: '31063405638',
    firstName: 'AHMED',
    lastName: 'ALI A A AL-LENQAWI',
    email: 'ahmed.ali.31063405638@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 9, 17), // October 17, 2010
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
    dateOfBirth: new Date(2010, 8, 30), // September 30, 2010
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
    dateOfBirth: new Date(2010, 2, 15), // March 15, 2010
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
  },
  {
    studentId: '31063407605',
    firstName: 'HASSAN',
    lastName: 'AQEEL A B AL-KHUZAEI',
    email: 'hassan.aqeel.31063407605@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 11, 31), // December 31, 2010
    parentContact: {
      fatherName: 'AQEEL AL-KHUZAEI',
      motherName: 'ZAINAB AL-KHUZAEI',
      phoneNumber: '+97430123004',
      email: 'parent.hassan.31063407605@gmail.com'
    },
    address: {
      street: '126 Doha Street',
      city: 'Doha',
      postalCode: '12348'
    },
    medicalInfo: {
      bloodType: 'AB+',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.6,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '31063402225',
    firstName: 'RASHID',
    lastName: 'AHMED R S NAFWA',
    email: 'rashid.ahmed.31063402225@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 4, 14), // May 14, 2010
    parentContact: {
      fatherName: 'AHMED NAFWA',
      motherName: 'LAYLA NAFWA',
      phoneNumber: '+97430123005',
      email: 'parent.rashid.31063402225@gmail.com'
    },
    address: {
      street: '127 Doha Street',
      city: 'Umm Salal',
      postalCode: '12349'
    },
    medicalInfo: {
      bloodType: 'O-',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.4,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '31063403008',
    firstName: 'SAAD',
    lastName: 'ABDULRAHMAN S H AL-AHBABI',
    email: 'saad.abdulrahman.31063403008@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 5, 16), // June 16, 2010
    parentContact: {
      fatherName: 'ABDULRAHMAN AL-AHBABI',
      motherName: 'NOUR AL-AHBABI',
      phoneNumber: '+97430123006',
      email: 'parent.saad.31063403008@gmail.com'
    },
    address: {
      street: '128 Doha Street',
      city: 'Al Wakrah',
      postalCode: '12350'
    },
    medicalInfo: {
      bloodType: 'A-',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.8,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '31163403555',
    firstName: 'ABDULAZIZ',
    lastName: 'MOHAMMED A H AL-EMADI',
    email: 'abdulaziz.mohammed.31163403555@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2011, 6, 3), // July 3, 2011
    parentContact: {
      fatherName: 'MOHAMMED AL-EMADI',
      motherName: 'KHADIJA AL-EMADI',
      phoneNumber: '+97430123007',
      email: 'parent.abdulaziz.31163403555@gmail.com'
    },
    address: {
      street: '129 Doha Street',
      city: 'Doha',
      postalCode: '12351'
    },
    medicalInfo: {
      bloodType: 'B-',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.9,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '31063405360',
    firstName: 'ALI',
    lastName: 'KHALID E G AL-KUBAISI',
    email: 'ali.khalid.31063405360@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 8, 19), // September 19, 2010
    parentContact: {
      fatherName: 'KHALID AL-KUBAISI',
      motherName: 'SARAH AL-KUBAISI',
      phoneNumber: '+97430123008',
      email: 'parent.ali.31063405360@gmail.com'
    },
    address: {
      street: '130 Doha Street',
      city: 'Al Rayyan',
      postalCode: '12352'
    },
    medicalInfo: {
      bloodType: 'AB-',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.2,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '31063401951',
    firstName: 'ESSA',
    lastName: 'ABDULRAHMAN A A ZYARA',
    email: 'essa.abdulrahman.31063401951@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 3, 25), // April 25, 2010
    parentContact: {
      fatherName: 'ABDULRAHMAN ZYARA',
      motherName: 'AMIRA ZYARA',
      phoneNumber: '+97430123009',
      email: 'parent.essa.31063401951@gmail.com'
    },
    address: {
      street: '131 Doha Street',
      city: 'Doha',
      postalCode: '12353'
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
    studentId: '31063406096',
    firstName: 'GHANIM',
    lastName: 'ABDULAZIZ J K AL-HAJAJI',
    email: 'ghanim.abdulaziz.31063406096@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 10, 11), // November 11, 2010
    parentContact: {
      fatherName: 'ABDULAZIZ AL-HAJAJI',
      motherName: 'LINA AL-HAJAJI',
      phoneNumber: '+97430123010',
      email: 'parent.ghanim.31063406096@gmail.com'
    },
    address: {
      street: '132 Doha Street',
      city: 'Umm Salal',
      postalCode: '12354'
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
    studentId: '31063407149',
    firstName: 'FADUL',
    lastName: 'KHALID O M ALNAIMI',
    email: 'fadul.khalid.31063407149@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 11, 21), // December 21, 2010
    parentContact: {
      fatherName: 'KHALID ALNAIMI',
      motherName: 'EMILY ALNAIMI',
      phoneNumber: '+97430123011',
      email: 'parent.fadul.31063407149@gmail.com'
    },
    address: {
      street: '133 Doha Street',
      city: 'Al Wakrah',
      postalCode: '12355'
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
  },
  {
    studentId: '31163402014',
    firstName: 'MOHAMMED',
    lastName: 'GHAREEB M Z AL-ABSI',
    email: 'mohammed.ghareeb.31163402014@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2011, 3, 14), // April 14, 2011
    parentContact: {
      fatherName: 'GHAREEB AL-ABSI',
      motherName: 'FATIMA AL-ABSI',
      phoneNumber: '+97430123012',
      email: 'parent.mohammed.31163402014@gmail.com'
    },
    address: {
      street: '134 Doha Street',
      city: 'Doha',
      postalCode: '12356'
    },
    medicalInfo: {
      bloodType: 'AB+',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.6,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '30963407440',
    firstName: 'MOHAMMED',
    lastName: 'MASAAD H A ALKORBI',
    email: 'mohammed.masaad.30963407440@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2009, 11, 2), // December 2, 2009
    parentContact: {
      fatherName: 'MASAAD ALKORBI',
      motherName: 'AISHA ALKORBI',
      phoneNumber: '+97430123013',
      email: 'parent.mohammed.30963407440@gmail.com'
    },
    address: {
      street: '135 Doha Street',
      city: 'Al Rayyan',
      postalCode: '12357'
    },
    medicalInfo: {
      bloodType: 'O-',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.4,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '31163402108',
    firstName: 'NASSER',
    lastName: 'HAMAD N B AHMED',
    email: 'nasser.hamad.31163402108@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2011, 4, 1), // May 1, 2011
    parentContact: {
      fatherName: 'HAMAD AHMED',
      motherName: 'MARYAM AHMED',
      phoneNumber: '+97430123014',
      email: 'parent.nasser.31163402108@gmail.com'
    },
    address: {
      street: '136 Doha Street',
      city: 'Doha',
      postalCode: '12358'
    },
    medicalInfo: {
      bloodType: 'A-',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.8,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  },
  {
    studentId: '31004800006',
    firstName: 'NASER',
    lastName: 'MOHAMED N A AL-JANAHI',
    email: 'naser.mohamed.31004800006@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 1, 12), // February 12, 2010
    parentContact: {
      fatherName: 'MOHAMED AL-JANAHI',
      motherName: 'ZAINAB AL-JANAHI',
      phoneNumber: '+97430123015',
      email: 'parent.naser.31004800006@gmail.com'
    },
    address: {
      street: '137 Doha Street',
      city: 'Umm Salal',
      postalCode: '12359'
    },
    medicalInfo: {
      bloodType: 'B-',
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
    studentId: '31063400298',
    firstName: 'NASSER',
    lastName: 'MOHAMED N A AL-MOHANNADI',
    email: 'nasser.mohamed.31063400298@qstss.edu.qa',
    grade: '9',
    class: '09/1',
    dateOfBirth: new Date(2010, 0, 2), // January 2, 2010
    parentContact: {
      fatherName: 'MOHAMED AL-MOHANNADI',
      motherName: 'NOUR AL-MOHANNADI',
      phoneNumber: '+97430123016',
      email: 'parent.nasser.31063400298@gmail.com'
    },
    address: {
      street: '138 Doha Street',
      city: 'Al Wakrah',
      postalCode: '12360'
    },
    medicalInfo: {
      bloodType: 'AB-',
      allergies: ['None'],
      medications: 'None'
    },
    academicInfo: {
      gpa: 3.7,
      previousGrades: {},
      specialNeeds: 'None'
    },
    isActive: true
  }
];

async function addStudents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('Connected successfully!');

    console.log(`Adding ${studentsToAdd.length} students...`);
    
    // Check for existing students
    const existingStudents = await Student.find({
      studentId: { $in: studentsToAdd.map(s => s.studentId) }
    });
    
    console.log(`Found ${existingStudents.length} existing students`);
    
    // Filter out existing students
    const existingIds = existingStudents.map(s => s.studentId);
    const newStudents = studentsToAdd.filter(s => !existingIds.includes(s.studentId));
    
    if (newStudents.length === 0) {
      console.log('All students already exist!');
    } else {
      console.log(`Inserting ${newStudents.length} new students...`);
      const inserted = await Student.insertMany(newStudents);
      console.log(`Successfully added ${inserted.length} students!`);
      
      // Show added students
      inserted.forEach((student, i) => {
        console.log(`${i+1}. ${student.firstName} ${student.lastName} (${student.studentId}) - Grade ${student.grade}, Class ${student.class}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('Connection closed');
  }
}

addStudents();
