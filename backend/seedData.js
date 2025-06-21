const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Competition = require('./models/Competition');
require('dotenv').config();

// Generate 242 students distributed across different classes and grades
function generateStudents() {
  const students = [];
  
  // First, add the real Qatar students from the provided data
  const realQatarStudents = [
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
  
  // Add the real Qatar students first
  students.push(...realQatarStudents);
  
  // Then add the remaining randomly generated students to reach 242 total
  const firstNames = [
    'Abdullah', 'Ahmad', 'Mohammed', 'Omar', 'Khalid', 'Hassan', 'Ali', 'Yusuf', 'Ibrahim', 'Mahmoud',
    'Fatima', 'Aisha', 'Maryam', 'Khadija', 'Zainab', 'Nour', 'Layla', 'Sarah', 'Amira', 'Lina',
    'Adam', 'Noah', 'Daniel', 'Lucas', 'Mason', 'Michael', 'David', 'James', 'Alexander', 'William',
    'Emma', 'Olivia', 'Sophia', 'Isabella', 'Ava', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Emily'
  ];
  
  const lastNames = [
    'Al-Ahmed', 'Al-Mahmoud', 'Al-Hassan', 'Al-Salem', 'Al-Rashid', 'Al-Zahra', 'Al-Nouri', 'Al-Khatib',
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White'
  ];

  const grades = ['9', '10', '11', '12']; // Qatar Science and Technology Secondary School grades
  const classes = ['A', 'B', 'C', 'D']; // 4 sections per grade
  
  let studentId = 1000;
  const usedEmails = new Set();
  
  // Generate remaining students to reach 242 total (we already have 16 real Qatar students)
  const remainingStudentsCount = 242 - realQatarStudents.length;
  
  for (let i = 0; i < remainingStudentsCount; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const grade = grades[Math.floor(Math.random() * grades.length)];
    const classSection = classes[Math.floor(Math.random() * classes.length)];
    
    // Ensure unique email
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace('al-', '')}.${studentId}@qstss.edu.qa`;
    while (usedEmails.has(email)) {
      studentId++;
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace('al-', '')}.${studentId}@qstss.edu.qa`;
    }
    usedEmails.add(email);
    
    students.push({
      studentId: `QS${studentId++}`, // Qatar Science prefix
      firstName,
      lastName,
      email,
      grade,
      class: `${grade}${classSection}`,
      dateOfBirth: new Date(2010 - parseInt(grade), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      parentContact: {
        fatherName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName}`,
        motherName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName}`,
        phoneNumber: `+974${Math.floor(Math.random() * 90000000) + 30000000}`, // Qatar phone numbers
        email: `parent.${lastName.toLowerCase().replace('al-', '')}.${i}@gmail.com`
      },
      address: {
        street: `${Math.floor(Math.random() * 999) + 1} Al Corniche Street`,
        city: ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah'][Math.floor(Math.random() * 4)], // Qatar cities
        postalCode: `${Math.floor(Math.random() * 90000) + 10000}`
      },
      medicalInfo: {
        bloodType: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
        allergies: Math.random() > 0.7 ? ['None'] : ['Peanuts', 'Dairy', 'None'][Math.floor(Math.random() * 3)],
        medications: Math.random() > 0.9 ? 'Inhaler for asthma' : 'None'
      },
      academicInfo: {
        gpa: (Math.random() * 3 + 1).toFixed(2), // GPA between 1.0 and 4.0
        previousGrades: {},
        specialNeeds: Math.random() > 0.95 ? 'Learning support' : 'None'
      },
      isActive: true
    });
  }
  
  return students;
}

const sampleData = {
  teachers: [
    {
      email: 'admin@qstss.edu.qa',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      department: 'Administration',
      subjects: ['Management'],
      role: 'admin'
    },
    {
      email: 'john.smith@qstss.edu.qa',
      password: 'teacher123',
      firstName: 'John',
      lastName: 'Smith',
      department: 'Mathematics',
      subjects: ['Algebra', 'Geometry'],
      phoneNumber: '+97430123456'
    },
    {
      email: 'sarah.johnson@qstss.edu.qa',
      password: 'teacher123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      department: 'Science',
      subjects: ['Biology', 'Chemistry'],
      phoneNumber: '+97430123457'
    },
    {
      email: 'mike.davis@qstss.edu.qa',
      password: 'teacher123',
      firstName: 'Mike',
      lastName: 'Davis',
      department: 'English',
      subjects: ['Literature', 'Writing'],
      phoneNumber: '+97430123458'
    }
  ],

  students: generateStudents(),

  competitions: [
    {
      name: 'Qatar National Mathematics Olympiad 2025',
      description: 'Annual mathematics competition for high school students across Qatar, hosted by Qatar Science and Technology Secondary School for Boys',
      category: 'MATH',
      maxParticipants: 100,
      maxStudentsPerTeacher: 4,
      startDate: new Date('2025-07-15'),
      endDate: new Date('2025-07-16'),
      registrationDeadline: new Date('2025-06-30'),
      eligibleGrades: ['9', '10', '11', '12'],
      venue: 'Qatar Science and Technology Secondary School - Main Auditorium',
      rules: 'Students will solve complex mathematical problems within time limits. Calculators allowed for specific sections.',
      prizes: [
        { position: '1st Place', description: 'Gold Medal + 2000 QAR + University Scholarship', value: '2000 QAR' },
        { position: '2nd Place', description: 'Silver Medal + 1200 QAR', value: '1200 QAR' },
        { position: '3rd Place', description: 'Bronze Medal + 800 QAR', value: '800 QAR' }
      ],
      organizerName: 'Qatar Foundation for Education',
      country: 'Qatar',
      participantCount: 0,
      status: 'upcoming'
    },
    {
      name: 'Gulf Science Fair 2025',
      description: 'Regional science fair showcasing innovative science projects from students across the Gulf region',
      category: 'STEM',
      maxParticipants: 80,
      maxStudentsPerTeacher: 3,
      startDate: new Date('2025-08-20'),
      endDate: new Date('2025-08-22'),
      registrationDeadline: new Date('2025-07-30'),
      eligibleGrades: ['9', '10', '11', '12'],
      venue: 'Qatar National Convention Centre',
      rules: 'Students present original scientific research projects with poster presentations and demonstrations.',
      prizes: [
        { position: '1st Place', description: 'Research Grant + Trophy + 4000 QAR', value: '4000 QAR' },
        { position: '2nd Place', description: 'Laboratory Equipment Set + 2400 QAR', value: '2400 QAR' },
        { position: '3rd Place', description: 'Science Book Collection + 1200 QAR', value: '1200 QAR' }
      ],
      organizerName: 'Gulf Cooperation Council Education Authority',
      country: 'Qatar',
      participantCount: 0,
      status: 'upcoming'
    },
    {
      name: 'Arabic Literary Excellence Competition',
      description: 'Creative writing and poetry contest celebrating Arabic literature and contemporary expression',
      category: 'ARABIC',
      maxParticipants: 60,
      maxStudentsPerTeacher: 4,
      startDate: new Date('2025-09-10'),
      endDate: new Date('2025-09-10'),
      registrationDeadline: new Date('2025-08-25'),
      eligibleGrades: ['9', '10', '11', '12'],
      venue: 'Qatar National Library - Heritage Hall',
      rules: 'Students submit original creative works in Arabic. Categories include poetry, short stories, and essays.',
      prizes: [
        { position: '1st Place', description: 'Publication Opportunity + 1600 QAR + Mentorship', value: '1600 QAR' },
        { position: '2nd Place', description: 'Writing Workshop Access + 1000 QAR', value: '1000 QAR' },
        { position: '3rd Place', description: 'Certificate + 600 QAR', value: '600 QAR' }
      ],
      organizerName: 'Qatar Ministry of Culture and Heritage',
      country: 'Qatar',
      participantCount: 0,
      status: 'upcoming'
    },
    {
      name: 'Qatar Technology Innovation Challenge 2025',
      description: 'Student-led technology and programming projects aligned with Qatar National Vision 2030',
      category: 'AI',
      maxParticipants: 50,
      maxStudentsPerTeacher: 2,
      startDate: new Date('2025-10-05'),
      endDate: new Date('2025-10-07'),
      registrationDeadline: new Date('2025-09-20'),
      eligibleGrades: ['10', '11', '12'],
      venue: 'Qatar Science & Technology Park - Innovation Hub',
      rules: 'Teams develop and present innovative technology solutions addressing local challenges. Projects must align with Qatar National Vision 2030.',
      prizes: [
        { position: '1st Place', description: 'Tech Startup Mentorship + 3200 QAR + Internship Opportunity', value: '3200 QAR' },
        { position: '2nd Place', description: 'Professional Development Course + 2000 QAR', value: '2000 QAR' },
        { position: '3rd Place', description: 'Tech Equipment Package + 1200 QAR', value: '1200 QAR' }
      ],
      organizerName: 'Qatar Foundation - Education City',
      country: 'Qatar',
      participantCount: 0,
      status: 'upcoming'
    }
  ]
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher-portal';
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    console.log('Connected to MongoDB successfully');

    // Clear existing data
    console.log('Clearing existing data...');
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await Competition.deleteMany({});
    console.log('Existing data cleared');

    // Hash passwords for teachers
    for (let teacher of sampleData.teachers) {
      teacher.password = await bcrypt.hash(teacher.password, 10);
    }

    // Insert teachers
    console.log('Inserting teachers...');
    const teachers = await Teacher.insertMany(sampleData.teachers);
    console.log(`${teachers.length} teachers inserted`);

    // Insert students
    console.log('Inserting students...');
    const students = await Student.insertMany(sampleData.students);
    console.log(`${students.length} students inserted`);

    // Set organizer for competitions (use first teacher)
    const competitions = sampleData.competitions.map(comp => ({
      ...comp,
      organizer: teachers[0]._id
    }));

    // Insert competitions
    console.log('Inserting competitions...');
    const insertedCompetitions = await Competition.insertMany(competitions);
    console.log(`${insertedCompetitions.length} competitions inserted`);

    console.log('\n=== Database Seeding Complete ===');
    console.log(`Teachers: ${teachers.length}`);
    console.log(`Students: ${students.length}`);
    console.log(`Competitions: ${insertedCompetitions.length}`);
    
    console.log('\n=== Demo Credentials ===');
    console.log('Admin: admin@qstss.edu.qa / admin123');
    console.log('Teacher: john.smith@qstss.edu.qa / teacher123');
    console.log('Teacher: sarah.johnson@qstss.edu.qa / teacher123');
    console.log('Teacher: mike.davis@qstss.edu.qa / teacher123');

  } catch (error) {
    console.error('Error seeding database:', error.message);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\nMongoDB is not running. Please start MongoDB with: brew services start mongodb/brew/mongodb-community');
      console.error('Or install MongoDB: brew install mongodb/brew/mongodb-community');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
