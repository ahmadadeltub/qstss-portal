const express = require('express');
const Teacher = require('../models/Teacher');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const teachers = await Teacher.find({}).select('-password');
    res.json({ teachers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});

module.exports = router;
