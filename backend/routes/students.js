const express = require('express');
const Student = require('../models/Student');
const Registration = require('../models/Registration');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all students with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, grade, class: studentClass } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (grade) {
      filter.grade = grade;
    }
    
    if (studentClass) {
      filter.class = studentClass;
    }

    // Execute query with pagination
    const students = await Student.find(filter)
      .select('-__v')
      .sort({ lastName: 1, firstName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(filter);

    res.json({
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get student by ID (admin only)
router.get('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student's registrations
    const Registration = require('../models/Registration');
    const registrations = await Registration.find({
      'students.student': student._id
    }).populate('competition', 'name category startDate endDate status')
     .populate('teacher', 'firstName lastName email');

    res.json({
      student,
      registrations: registrations.map(reg => ({
        id: reg._id,
        competition: reg.competition,
        teacher: reg.teacher,
        registrationDate: reg.registrationDate,
        status: reg.status,
        teamName: reg.teamName
      }))
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

// Create new student (admin only)
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student ID or email already exists' });
    }
    res.status(500).json({ message: 'Failed to create student' });
  }
});

// Update student (admin only)
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

// Delete student (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // Check if student has any registrations
    const Registration = require('../models/Registration');
    const hasRegistrations = await Registration.exists({
      'students.student': req.params.id
    });

    if (hasRegistrations) {
      return res.status(400).json({ 
        message: 'Cannot delete student with existing competition registrations' 
      });
    }

    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

// Bulk import students (admin only)
router.post('/bulk-import', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { students } = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Students array is required' });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    for (const studentData of students) {
      try {
        const existingStudent = await Student.findOne({ 
          $or: [
            { studentId: studentData.studentId },
            { email: studentData.email }
          ]
        });
        
        if (existingStudent) {
          results.skipped++;
          continue;
        }

        await Student.create(studentData);
        results.created++;
      } catch (error) {
        results.errors.push({
          studentId: studentData.studentId,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk import completed',
      results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Bulk import failed' });
  }
});

// Get unique grades and classes for filtering (public endpoint for metadata)
router.get('/meta/filters', async (req, res) => {
  try {
    console.log('📊 Fetching student filters...');
    const grades = await Student.distinct('grade', { isActive: true });
    const classes = await Student.distinct('class', { isActive: true });
    
    // Ensure proper ordering of grades
    const orderedGrades = ['9', '10', '11-Engineering', '11-IT', '11-Medical', '12-Engineering', '12-IT', '12-Medical']
      .filter(grade => grades.includes(grade));
    
    // Add any additional grades not in our expected list
    const additionalGrades = grades.filter(grade => !orderedGrades.includes(grade));
    const finalGrades = [...orderedGrades, ...additionalGrades];
    
    console.log('📊 Raw grades from DB:', grades);
    console.log('📊 Final ordered grades:', finalGrades);
    console.log('📊 Found classes:', classes.sort());
    
    res.json({
      grades: finalGrades,
      classes: classes.sort()
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

module.exports = router;
