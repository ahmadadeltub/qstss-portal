const express = require('express');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.teacher.role === 'admin';
    
    if (isAdmin) {
      const [totalTeachers, totalStudents, totalCompetitions, totalRegistrations] = await Promise.all([
        Teacher.countDocuments({ isActive: true }),
        Student.countDocuments({ isActive: true }),
        Competition.countDocuments({ isActive: true }),
        Registration.countDocuments()
      ]);

      res.json({
        stats: { totalTeachers, totalStudents, totalCompetitions, totalRegistrations }
      });
    } else {
      const myRegistrations = await Registration.countDocuments({ teacher: req.teacher._id });
      res.json({ stats: { myRegistrations } });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
