const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  grade: { type: String, required: true, trim: true },
  class: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date },
  parentContact: {
    name: String,
    phone: String,
    email: String
  },
  academicYear: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  skills: [{ type: String, trim: true }],
  achievements: [{
    title: String,
    description: String,
    date: Date
  }]
}, { timestamps: true });

studentSchema.index({ grade: 1, class: 1 });
studentSchema.index({ studentId: 1 });

module.exports = mongoose.model('Student', studentSchema);
