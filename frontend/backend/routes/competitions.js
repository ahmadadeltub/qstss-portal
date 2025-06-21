const express = require('express');
const Competition = require('../models/Competition');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const competitions = await Competition.find({ isActive: true })
      .populate('organizer', 'firstName lastName email')
      .sort({ startDate: 1 });
    res.json({ competitions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch competitions' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate('organizer', 'firstName lastName email department');
    
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    res.json({ competition });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch competition' });
  }
});

module.exports = router;
