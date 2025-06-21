const express = require('express');
const Student = require('../models/Student');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { studentId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const students = await Student.find(filter)
      .sort({ grade: 1, class: 1, lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(filter);

    res.json({
      students,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

router.get('/meta/classes', authenticateToken, async (req, res) => {
  try {
    const grades = await Student.distinct('grade');
    const classes = await Student.distinct('class');
    res.json({ grades: grades.sort(), classes: classes.sort() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch class information' });
  }
});

module.exports = router;
