console.log('🚀 Starting import...');

const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('./models/Student');

mongoose.connect('mongodb://localhost:27017/teacher-portal')
  .then(async () => {
    console.log('✅ Connected');
    
    await Student.deleteMany({});
    console.log('🗑️ Cleared');
    
    const data = fs.readFileSync('students_data.txt', 'utf8');
    const lines = data.trim().split('\n');
    
    console.log(`📄 Found ${lines.length} students`);
    
    const students = lines.map((line, i) => {
      const [id, name, grade, cls] = line.split(',');
      const parts = name.split(' ');
      
      return {
        studentId: id,
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
        email: `${parts[0].toLowerCase()}.${parts[1]?.toLowerCase() || 'student'}.${id}@qstss.edu.qa`,
        grade: grade,
        class: cls,
        dateOfBirth: new Date(2010, 0, 1),
        parentContact: {
          fatherName: `Father of ${parts[0]}`,
          motherName: `Mother of ${parts[0]}`,
          phoneNumber: `+97450${String(130000 + i).slice(-6)}`,
          email: `parent.${id}@qstss.edu.qa`
        },
        address: { street: `${i + 100} St`, city: 'Doha', postalCode: '12345' },
        medicalInfo: { bloodType: 'O+', allergies: ['None'], medications: 'None' },
        academicInfo: { previousGrades: {}, specialNeeds: 'None' },
        isActive: true
      };
    });
    
    const result = await Student.insertMany(students);
    console.log(`✅ SUCCESS! Imported ${result.length} students`);
    
    const count = await Student.countDocuments();
    console.log(`📊 Total: ${count}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌', err.message);
    process.exit(1);
  });
