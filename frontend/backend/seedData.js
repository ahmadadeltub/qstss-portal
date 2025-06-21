const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Competition = require('./models/Competition');
require('dotenv').config();

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_portal');
    
    console.log('Clearing existing data...');
    await Promise.all([
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Competition.deleteMany({})
    ]);
    
    console.log('Creating teachers...');
    const teachers = await Teacher.create([
      {
        email: 'admin@school.edu',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        department: 'Administration',
        subjects: ['Management'],
        role: 'admin'
      },
      {
        email: 'john.smith@school.edu',
        password: 'teacher123',
        firstName: 'John',
        lastName: 'Smith',
        department: 'Mathematics',
        subjects: ['Algebra', 'Geometry'],
        phoneNumber: '+1234567890'
      },
      {
        email: 'sarah.johnson@school.edu',
        password: 'teacher123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        department: 'Science',
        subjects: ['Biology', 'Chemistry'],
        phoneNumber: '+1234567891'
      }
    ]);
    
    console.log('Creating students...');
    const students = [];
    const grades = ['8', '9', '10', '11', '12'];
    const classes = ['A', 'B', 'C', 'D'];
    
    for (let i = 1; i <= 242; i++) {
      const grade = grades[Math.floor(Math.random() * grades.length)];
      const classLetter = classes[Math.floor(Math.random() * classes.length)];
      
      students.push({
        studentId: `STU${String(i).padStart(4, '0')}`,
        firstName: `Student${i}`,
        lastName: `Last${i}`,
        email: `student${i}@school.edu`,
        grade,
        class: `${grade}${classLetter}`,
        academicYear: '2024-2025',
        dateOfBirth: new Date(2010 - parseInt(grade) + 8, 0, 1)
      });
    }
    
    await Student.create(students);
    
    console.log('Creating competitions...');
    await Competition.create([
      {
        name: 'Mathematics Olympiad 2025',
        description: 'Annual mathematics competition for high school students',
        category: 'Mathematics',
        maxParticipants: 100,
        maxStudentsPerTeacher: 4,
        startDate: new Date('2025-07-15'),
        endDate: new Date('2025-07-15'),
        registrationDeadline: new Date('2025-07-01'),
        eligibleGrades: ['9', '10', '11', '12'],
        venue: 'Main Auditorium',
        organizer: teachers[1]._id,
        status: 'upcoming'
      },
      {
        name: 'Science Fair 2025',
        description: 'Showcase innovative science projects',
        category: 'Science',
        maxParticipants: 80,
        maxStudentsPerTeacher: 3,
        startDate: new Date('2025-08-20'),
        endDate: new Date('2025-08-22'),
        registrationDeadline: new Date('2025-08-01'),
        eligibleGrades: ['8', '9', '10', '11', '12'],
        venue: 'Science Laboratory Complex',
        organizer: teachers[2]._id,
        status: 'upcoming'
      }
    ]);
    
    console.log('Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@school.edu / admin123');
    console.log('Teacher: john.smith@school.edu / teacher123');
    console.log('Teacher: sarah.johnson@school.edu / teacher123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
