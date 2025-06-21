const express = require('express');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateToken = (teacherId) => {
  return jwt.sign({ teacherId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, department, subjects } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Email, password, first name, and last name are required' });
    }

    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher with this email already exists' });
    }

    const teacher = new Teacher({
      email, password, firstName, lastName, phoneNumber, department, subjects: subjects || []
    });

    await teacher.save();
    const token = generateToken(teacher._id);

    res.status(201).json({
      message: 'Teacher registered successfully',
      token,
      teacher: {
        id: teacher._id,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        department: teacher.department,
        role: teacher.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const teacher = await Teacher.findOne({ email }).select('+password');
    if (!teacher || !teacher.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await teacher.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    teacher.lastLogin = new Date();
    await teacher.save();

    const token = generateToken(teacher._id);

    res.json({
      message: 'Login successful',
      token,
      teacher: {
        id: teacher._id,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        department: teacher.department,
        role: teacher.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({ teacher: req.teacher });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

module.exports = router;
