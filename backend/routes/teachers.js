const express = require('express');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all teachers (admin only)
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const teachers = await Teacher.find(filter)
      .select('-password')
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Teacher.countDocuments(filter);

    res.json({
      teachers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});

// Get teacher by ID (admin only)
router.get('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select('-password');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ teacher });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ message: 'Failed to fetch teacher' });
  }
});

// Get departments and subjects metadata
router.get('/meta/departments', authenticateToken, async (req, res) => {
  try {
    const departments = await Teacher.distinct('department');
    const subjects = await Teacher.distinct('subjects');
    
    res.json({
      departments: departments.filter(d => d).sort(),
      subjects: subjects.flat().filter(s => s).sort()
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

// Create new teacher (admin only)
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, department, subjects, phoneNumber, role } = req.body;
    
    // Validation
    if (!email || !password || !firstName || !lastName || !department) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher with this email already exists' });
    }

    // Process subjects
    let subjectsArray = [];
    if (subjects) {
      if (typeof subjects === 'string') {
        subjectsArray = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (Array.isArray(subjects)) {
        subjectsArray = subjects;
      }
    }
    
    if (subjectsArray.length === 0) {
      subjectsArray = ['General'];
    }

    // Create teacher
    const teacher = new Teacher({
      email,
      password,
      firstName,
      lastName,
      department,
      subjects: subjectsArray,
      phoneNumber,
      role: role || 'teacher'
    });

    await teacher.save();

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: teacher.toJSON()
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ message: 'Failed to create teacher' });
  }
});

// Update teacher (admin only)
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { firstName, lastName, department, subjects, phoneNumber, role, isActive } = req.body;
    
    const updateData = {
      firstName,
      lastName,
      department,
      phoneNumber,
      isActive
    };

    // Process subjects
    if (subjects) {
      if (typeof subjects === 'string') {
        updateData.subjects = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (Array.isArray(subjects)) {
        updateData.subjects = subjects;
      }
    }

    // Update role if provided
    if (role && ['teacher', 'admin'].includes(role)) {
      updateData.role = role;
    }

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({
      message: 'Teacher updated successfully',
      teacher
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ message: 'Failed to update teacher' });
  }
});

// Delete teacher (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Prevent deleting self
    if (teacherId === req.teacher._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if teacher has registrations
    const Registration = require('../models/Registration');
    const hasRegistrations = await Registration.exists({ teacher: teacherId });
    
    if (hasRegistrations) {
      // Instead of deleting, deactivate the teacher
      const teacher = await Teacher.findByIdAndUpdate(
        teacherId,
        { isActive: false },
        { new: true }
      ).select('-password');
      
      return res.json({
        message: 'Teacher deactivated due to existing registrations',
        teacher
      });
    }

    // Safe to delete
    const teacher = await Teacher.findByIdAndDelete(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ message: 'Failed to delete teacher' });
  }
});

// Reset teacher password (admin only)
router.put('/:id/reset-password', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Update password (will be hashed by pre-save middleware)
    teacher.password = newPassword;
    await teacher.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;
