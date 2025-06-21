const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  grade: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  dateOfBirth: Date,
  parentContact: {
    fatherName: String,
    motherName: String,
    phoneNumber: String,
    email: String
  },
  address: {
    street: String,
    city: String,
    postalCode: String
  },
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    medications: String
  },
  academicInfo: {
    gpa: Number,
    previousGrades: mongoose.Schema.Types.Mixed,
    specialNeeds: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
