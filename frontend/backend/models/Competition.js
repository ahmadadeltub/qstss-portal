const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: [
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
  ] },
  maxParticipants: { type: Number, required: true, min: 1 },
  maxStudentsPerTeacher: { type: Number, default: 4, min: 1, max: 10 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  eligibleGrades: [{ type: String, required: true }],
  venue: { type: String, trim: true },
  rules: { type: String },
  prizes: [{ position: String, description: String, value: String }],
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  status: { type: String, enum: ['upcoming', 'active', 'completed', 'cancelled'], default: 'upcoming' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

competitionSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  if (this.registrationDeadline >= this.startDate) {
    next(new Error('Registration deadline must be before start date'));
  }
  next();
});

module.exports = mongoose.model('Competition', competitionSchema);
