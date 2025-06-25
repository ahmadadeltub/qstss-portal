const express = require('express');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const router = express.Router();

// Get all competitions with registration counts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    // Build filter
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const competitions = await Competition.find(filter)
      .populate('organizer', 'firstName lastName')
      .sort({ startDate: 1 });

    // Add registration counts
    const competitionsWithCounts = await Promise.all(
      competitions.map(async (comp) => {
        const registrationCount = await Registration.aggregate([
          { $match: { competition: comp._id } },
          { $unwind: '$students' },
          { $count: 'total' }
        ]);
        
        return {
          ...comp.toObject(),
          registeredCount: registrationCount[0]?.total || 0
        };
      })
    );

    res.json({ data: competitionsWithCounts });
  } catch (error) {
    console.error('Get competitions error:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// Get competition by ID
router.get('/:id', async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate('organizer', 'firstName lastName email');
    
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Get registration count
    const registrationCount = await Registration.aggregate([
      { $match: { competition: competition._id } },
      { $unwind: '$students' },
      { $count: 'total' }
    ]);

    res.json({
      ...competition.toObject(),
      registeredCount: registrationCount[0]?.total || 0
    });
  } catch (error) {
    console.error('Get competition error:', error);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

// Get competition categories for filtering
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Competition.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new competition (admin or teacher)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      maxParticipants,
      maxStudentsPerTeacher,
      startDate,
      endDate,
      registrationDeadline,
      eligibleGrades,
      venue,
      rules,
      prizes,
      organizerName,
      country,
      participantCount
    } = req.body;

    // Validation
    if (!name || !description || !category || !maxParticipants || !startDate || !endDate || !registrationDeadline || !eligibleGrades || !organizerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    const regDeadline = new Date(registrationDeadline);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({ error: 'Start date must be in the future' });
    }
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    if (regDeadline >= start) {
      return res.status(400).json({ error: 'Registration deadline must be before start date' });
    }

    const competition = new Competition({
      name,
      description,
      category,
      maxParticipants,
      maxStudentsPerTeacher: maxStudentsPerTeacher || 4,
      startDate: start,
      endDate: end,
      registrationDeadline: regDeadline,
      eligibleGrades,
      venue,
      rules,
      prizes: prizes || [],
      organizer: req.teacher._id,
      organizerName,
      country: country || 'Qatar',
      participantCount: participantCount || 0
    });

    await competition.save();

    const populatedCompetition = await Competition.findById(competition._id)
      .populate('organizer', 'firstName lastName');

    // Send real-time notification to all teachers and admins about new competition
    try {
      await notificationService.broadcastCompetitionUpdate(populatedCompetition, 'created');
      console.log('✅ Real-time notification sent to all teachers/admins about new competition');
    } catch (error) {
      console.error('❌ Failed to send real-time competition notification:', error);
    }

    res.status(201).json({
      message: 'Competition created successfully',
      competition: populatedCompetition
    });
  } catch (error) {
    console.error('Create competition error:', error);
    res.status(500).json({ error: 'Failed to create competition' });
  }
});

// Update competition (admin or organizer)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Check permissions (admin or organizer)
    if (req.teacher.role !== 'admin' && competition.organizer.toString() !== req.teacher._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this competition' });
    }

    const updates = req.body;
    
    // Date validation if dates are being updated
    if (updates.startDate || updates.endDate || updates.registrationDeadline) {
      const start = new Date(updates.startDate || competition.startDate);
      const end = new Date(updates.endDate || competition.endDate);
      const regDeadline = new Date(updates.registrationDeadline || competition.registrationDeadline);

      if (end <= start) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
      if (regDeadline >= start) {
        return res.status(400).json({ error: 'Registration deadline must be before start date' });
      }
    }

    Object.assign(competition, updates);
    await competition.save();

    const updatedCompetition = await Competition.findById(competition._id)
      .populate('organizer', 'firstName lastName');

    // Send real-time notification to all teachers and admins about competition update
    try {
      await notificationService.broadcastCompetitionUpdate(updatedCompetition, 'updated');
      console.log('✅ Real-time notification sent to all teachers/admins about competition update');
    } catch (error) {
      console.error('❌ Failed to send real-time competition update notification:', error);
    }

    res.json({
      message: 'Competition updated successfully',
      competition: updatedCompetition
    });
  } catch (error) {
    console.error('Update competition error:', error);
    res.status(500).json({ error: 'Failed to update competition' });
  }
});

// Delete competition (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Check if there are any registrations
    const registrationCount = await Registration.countDocuments({ competition: competition._id });
    
    if (registrationCount > 0) {
      // Don't delete, just deactivate
      competition.isActive = false;
      await competition.save();
      return res.json({ message: 'Competition deactivated due to existing registrations' });
    }

    await Competition.findByIdAndDelete(req.params.id);
    res.json({ message: 'Competition deleted successfully' });
  } catch (error) {
    console.error('Delete competition error:', error);
    res.status(500).json({ error: 'Failed to delete competition' });
  }
});

module.exports = router;
