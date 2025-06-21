const mongoose = require('mongoose');
const Student = require('./models/Student');

console.log('🚀 Simple Student Import Starting...');

// Your exact student data from the CSV
const studentsData = [
  ['31063405638', 'AHMED ALI A A AL-LENQAWI', '9', '09/1'],
  ['31063405109', 'TAMEEM A.HAKEEM A A BA-NOAMAN', '9', '09/1'],
  ['31063401274', 'HASSEN KHALID H A AL-KUWARI', '9', '09/1'],
  ['31063407605', 'HASSAN AQEEL A B AL-KHUZAEI', '9', '09/1'],
  ['31063402225', 'RASHID AHMED R S NAFWA', '9', '09/1'],
  ['31063403008', 'SAAD ABDULRAHMAN S H AL-AHBABI', '9', '09/1'],
  ['31163403555', 'ABDULAZIZ MOHAMMED A H AL-EMADI', '9', '09/1'],
  ['31063405360', 'ALI KHALID E G AL-KUBAISI', '9', '09/1'],
  ['31063401951', 'ESSA ABDULRAHMAN A A ZYARA', '9', '09/1'],
  ['31063406096', 'GHANIM ABDULAZIZ J K AL-HAJAJI', '9', '09/1']
];

async function simpleImport() {
  try {
    await mongoose.connect('mongodb://localhost:27017/teacher-portal');
    console.log('✅ Connected to database');
    
    // Clear existing
    await Student.deleteMany({});
    console.log('🗑️ Database cleared');
    
    const students = studentsData.map((data, index) => {
      const [id, name, grade, className] = data;
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      return {
        studentId: id,
        firstName: firstName,
        lastName: lastName,
        email: `${firstName.toLowerCase()}.${lastName.split(' ')[0].toLowerCase()}.${id}@qstss.edu.qa`,
        grade: grade,
        class: className,
        dateOfBirth: new Date(2010, 5, 15),
        parentContact: {
          fatherName: `Father of ${firstName}`,
          motherName: `Mother of ${firstName}`,
          phoneNumber: `+97450130${String(index).padStart(3, '0')}`,
          email: `parent.${id}@qstss.edu.qa`
        },
        address: {
          street: `${index + 100} Qatar Street`,
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
      };
    });
    
    const result = await Student.insertMany(students);
    console.log(`✅ Imported ${result.length} students successfully!`);
    
    const total = await Student.countDocuments();
    console.log(`📊 Total in database: ${total}`);
    
    result.forEach((s, i) => {
      console.log(`${i + 1}. ${s.firstName} ${s.lastName} (${s.studentId})`);
    });
    
    mongoose.disconnect();
    console.log('✅ Test import completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
  }
}

simpleImport();
