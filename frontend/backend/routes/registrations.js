const express = require('express');
const Registration = require('../models/Registration');
const Competition = require('../models/Competition');
const Student = require('../models/Student');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/my-registrations', authenticateToken, async (req, res) => {
  try {
    const registrations = await Registration.find({ teacher: req.teacher._id })
      .populate('competition', 'name category startDate endDate status')
      .populate('students.student', 'firstName lastName studentId grade class')
      .sort({ createdAt: -1 });
    res.json({ registrations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

router.post('/check-availability', authenticateToken, async (req, res) => {
  try {
    const { studentIds, competitionId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }

    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    const studentAvailability = await Promise.all(
      studentIds.map(async (studentId) => {
        const student = await Student.findById(studentId);
        if (!student) {
          return { studentId, available: false, reason: 'Student not found' };
        }

        const existingRegistration = await Registration.findOne({
          competition: competitionId,
          'students.student': studentId
        }).populate('teacher', 'firstName lastName email');

        if (existingRegistration) {
          return {
            studentId,
            student: {
              id: student._id,
              name: `${student.firstName} ${student.lastName}`,
              studentId: student.studentId,
              grade: student.grade,
              class: student.class
            },
            available: false,
            reason: 'Already registered',
            registeredBy: {
              teacher: existingRegistration.teacher,
              registrationDate: existingRegistration.registrationDate
            }
          };
        }

        return {
          studentId,
          student: {
            id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            studentId: student.studentId,
            grade: student.grade,
            class: student.class
          },
          available: true,
          reason: 'Available'
        };
      })
    );

    res.json({ studentAvailability });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check student availability' });
  }
});

router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { competitionId, studentIds, teamName, notes } = req.body;

    if (!competitionId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Competition ID and student IDs array are required' });
    }

    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    if (new Date() > competition.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    if (studentIds.length > competition.maxStudentsPerTeacher) {
      return res.status(400).json({ 
        message: `Cannot register more than ${competition.maxStudentsPerTeacher} students for this competition` 
      });
    }

    const existingRegistration = await Registration.findOne({
      competition: competitionId,
      teacher: req.teacher._id
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'You have already registered for this competition' });
    }

    const registration = new Registration({
      competition: competitionId,
      teacher: req.teacher._id,
      students: studentIds.map(studentId => ({
        student: studentId,
        registrationDate: new Date(),
        status: 'registered'
      })),
      teamName: teamName || null,
      notes: notes || null,
      status: 'pending'
    });

    await registration.save();
    await registration.populate('competition', 'name category startDate endDate');
    await registration.populate('students.student', 'firstName lastName studentId grade class');

    res.status(201).json({
      message: 'Registration successful',
      registration
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

module.exports = router;
