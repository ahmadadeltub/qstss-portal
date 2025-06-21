const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, department, subjects, phoneNumber } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Teacher with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Process subjects - handle comma-separated string or array
    let subjectsArray = [];
    if (subjects) {
      if (typeof subjects === 'string') {
        subjectsArray = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (Array.isArray(subjects)) {
        subjectsArray = subjects;
      }
    }
    
    // Default to General if no subjects provided
    if (subjectsArray.length === 0) {
      subjectsArray = ['General'];
    }

    // Create teacher
    const teacher = new Teacher({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      department,
      subjects: subjectsArray,
      phoneNumber
    });

    await teacher.save();

    // Generate JWT token
    const token = jwt.sign(
      { teacherId: teacher._id, email: teacher.email, role: teacher.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

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
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register teacher' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find teacher
    const teacher = await Teacher.findOne({ email, isActive: true });
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, teacher.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { teacherId: teacher._id, email: teacher.email, role: teacher.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id)
      .select('-password')
      .lean();

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({
      teacher: {
        id: teacher._id,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        department: teacher.department,
        role: teacher.role,
        subjects: teacher.subjects,
        phoneNumber: teacher.phoneNumber,
        isActive: teacher.isActive
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

module.exports = router;
