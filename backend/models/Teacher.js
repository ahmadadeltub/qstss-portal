const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
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
  department: {
    type: String,
    required: true
  },
  subjects: [{
    type: String,
    required: true
  }],
  phoneNumber: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['teacher', 'admin'],
    default: 'teacher'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  bio: {
    type: String,
    maxlength: 500
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
teacherSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hide password in JSON output
teacherSchema.methods.toJSON = function() {
  const teacher = this.toObject();
  delete teacher.password;
  return teacher;
};

module.exports = mongoose.model('Teacher', teacherSchema);
