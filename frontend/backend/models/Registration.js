const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  students: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    registrationDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['registered', 'confirmed', 'participated', 'withdrawn'], default: 'registered' }
  }],
  teamName: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  registrationDate: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  results: {
    position: Number,
    score: Number,
    feedback: String,
    completedAt: Date
  }
}, { timestamps: true });

registrationSchema.index({ competition: 1, teacher: 1 }, { unique: true });
registrationSchema.index({ competition: 1 });
registrationSchema.index({ teacher: 1 });
registrationSchema.index({ 'students.student': 1 });

registrationSchema.pre('save', async function(next) {
  try {
    const Competition = mongoose.model('Competition');
    const competition = await Competition.findById(this.competition);
    
    if (!competition) {
      return next(new Error('Competition not found'));
    }
    
    if (this.students.length > competition.maxStudentsPerTeacher) {
      return next(new Error(`Cannot register more than ${competition.maxStudentsPerTeacher} students for this competition`));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Registration', registrationSchema);
