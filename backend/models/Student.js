const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  grade: {
    type: String,
    required: true,
    enum: ['6', '7', '8', '9', '10', '11', '12', '11-Engineering', '11-IT', '11-Medical', '12-Engineering', '12-IT', '12-Medical']
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
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
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [String],
    medications: {
      type: String,
      default: 'None'
    }
  },
  academicInfo: {
    gpa: {
      type: Number,
      min: 0,
      max: 4
    },
    previousGrades: mongoose.Schema.Types.Mixed,
    specialNeeds: {
      type: String,
      default: 'None'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
