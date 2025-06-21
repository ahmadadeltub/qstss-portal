const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, trim: true },
  department: { type: String, trim: true },
  subjects: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['teacher', 'admin'], default: 'teacher' },
  lastLogin: { type: Date }
}, { timestamps: true });

teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

teacherSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

teacherSchema.methods.toJSON = function() {
  const teacher = this.toObject();
  delete teacher.password;
  return teacher;
};

module.exports = mongoose.model('Teacher', teacherSchema);
