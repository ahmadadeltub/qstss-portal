const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'STEM Department',
      'FAB Lab Department',
      'Energy Department',
      'Robotics Department',
      'Project Research Department',
      'Electronics Projects Department',
      'Computer Science Department',
      'Physics Department',
      'Mathematics Department',
      'Arabic Language Department',
      'Islamic Education Department',
      'English Language Department',
      'Virtual Reality (VR) Department',
      'Augmented Reality (AR) Department',
      'Social Studies Department',
      'Physical Education Department',
      'Design Technology Department',
      'Library Services Department'
    ]
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  maxStudentsPerTeacher: {
    type: Number,
    default: 4,
    min: 1,
    max: 10
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  eligibleGrades: [{
    type: String,
    required: true
  }],
  venue: String,
  rules: String,
  prizes: [{
    position: String,
    description: String,
    value: String
  }],
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  organizerName: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'Qatar'
  },
  participantCount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Competition', competitionSchema);
