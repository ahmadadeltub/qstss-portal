const express = require('express');
const Registration = require('../models/Registration');
const Competition = require('../models/Competition');
const Student = require('../models/Student');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const router = express.Router();

// Create new registration
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { competitionId, studentIds } = req.body;
    const teacherId = req.teacher._id;

    // Validate competition exists and is open for registration
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (competition.status !== 'upcoming') {
      return res.status(400).json({ error: 'Competition is not open for registration' });
    }

    if (new Date() > new Date(competition.registrationDeadline)) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    // Check if teacher already registered for this competition
    const existingRegistration = await Registration.findOne({
      competition: competitionId,
      teacher: teacherId
    });

    if (existingRegistration) {
      return res.status(400).json({ error: 'You have already registered for this competition' });
    }

    // Validate student count
    if (studentIds.length > competition.maxStudentsPerTeacher) {
      return res.status(400).json({ 
        error: `Maximum ${competition.maxStudentsPerTeacher} students allowed per teacher for this competition` 
      });
    }

    // Validate students exist and are eligible
    const students = await Student.find({ 
      _id: { $in: studentIds },
      isActive: true 
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ error: 'Some students not found or inactive' });
    }

    // Grade eligibility check removed - allow students from any grade
    // const ineligibleStudents = students.filter(student => 
    //   !competition.eligibleGrades.includes(student.grade)
    // );

    // if (ineligibleStudents.length > 0) {
    //   return res.status(400).json({ 
    //     error: `Students ${ineligibleStudents.map(s => s.firstName + ' ' + s.lastName).join(', ')} are not eligible for this competition` 
    //   });
    // }

    // Check if any student is already registered by another teacher for the SAME competition
    const conflictingRegistrations = await Registration.find({
      competition: competitionId,
      'students.student': { $in: studentIds }
    }).populate('teacher', 'firstName lastName');

    if (conflictingRegistrations.length > 0) {
      const conflictDetails = conflictingRegistrations.map(reg => 
        `${reg.teacher.firstName} ${reg.teacher.lastName}`
      ).join(', ');
      return res.status(400).json({ 
        error: `Some students are already registered by other teachers: ${conflictDetails}` 
      });
    }

    // Check for cross-competition conflicts (students registered in OTHER competitions)
    // This generates warnings but does NOT block registration
    const crossCompetitionConflicts = await Registration.find({
      competition: { $ne: competitionId }, // Different competitions only
      'students.student': { $in: studentIds }
    })
    .populate('competition', 'name')
    .populate('students.student', 'firstName lastName studentId');

    const warnings = [];
    if (crossCompetitionConflicts.length > 0) {
      const conflictMap = {};
      crossCompetitionConflicts.forEach(reg => {
        reg.students.forEach(studentReg => {
          if (studentIds.includes(studentReg.student._id.toString())) {
            const studentKey = studentReg.student._id.toString();
            if (!conflictMap[studentKey]) {
              conflictMap[studentKey] = {
                student: `${studentReg.student.firstName} ${studentReg.student.lastName}`,
                competitions: []
              };
            }
            conflictMap[studentKey].competitions.push(reg.competition.name);
          }
        });
      });

      // Create warning messages
      Object.values(conflictMap).forEach(conflict => {
        warnings.push(`${conflict.student} is already registered in: ${conflict.competitions.join(', ')}`);
      });
    }

    // Create registration regardless of cross-competition conflicts
    const registration = new Registration({
      competition: competitionId,
      teacher: teacherId,
      students: studentIds.map(studentId => ({ student: studentId }))
    });

    await registration.save();

    // Populate for response
    await registration.populate([
      { path: 'competition', select: 'name category startDate' },
      { path: 'students.student', select: 'firstName lastName studentId grade class' },
      { path: 'teacher', select: 'firstName lastName email' }
    ]);

    // Create professional notification for successful registration
    const studentNames = registration.students.map(s => `${s.student.firstName} ${s.student.lastName}`).join(', ');
    const teacherName = `${registration.teacher.firstName} ${registration.teacher.lastName}`;
    const notificationData = {
      type: 'registration',
      title: 'New Student Registration',
      message: `${studentNames} ${registration.students.length === 1 ? 'has' : 'have'} been successfully registered for "${registration.competition.name}" by ${teacherName}`,
      priority: 'medium',
      metadata: {
        competitionId: registration.competition._id,
        competitionName: registration.competition.name,
        teacherId: registration.teacher._id,
        teacherName: teacherName,
        studentCount: registration.students.length,
        students: registration.students.map(s => ({
          id: s.student._id,
          name: `${s.student.firstName} ${s.student.lastName}`,
          studentId: s.student.studentId,
          grade: s.student.grade
        })),
        registrationId: registration._id,
        registrationDate: registration.registrationDate,
        hasWarnings: warnings.length > 0,
        warnings: warnings
      }
    };

    // Store notification (you can enhance this to save to database if needed)
    console.log('📨 Registration Notification:', notificationData);

    const response = {
      message: 'Registration successful',
      registration,
      warnings: warnings.length > 0 ? warnings : undefined,
      notification: notificationData
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register students' });
  }
});

// Get my registrations
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    
    const registrations = await Registration.find({ teacher: teacherId })
      .populate('competition')
      .populate('students.student', 'firstName lastName studentId grade class')
      .sort({ registrationDate: -1 });

    res.json(registrations);
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Get registered students by competition ID
router.get('/competition/:competitionId', authenticateToken, async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    // Find all registrations for this competition
    const registrations = await Registration.find({ 
      competition: competitionId,
      status: { $ne: 'cancelled' } // Exclude cancelled registrations
    })
      .populate('teacher', 'firstName lastName department')
      .populate('students.student', 'firstName lastName studentId grade class')
      .sort({ registrationDate: 1 });

    // Transform the data to group students by teacher
    const registeredStudents = registrations.map(registration => ({
      registrationId: registration._id,
      teacher: {
        _id: registration.teacher._id,
        name: `${registration.teacher.firstName} ${registration.teacher.lastName}`,
        department: registration.teacher.department
      },
      students: registration.students.map(studentReg => ({
        _id: studentReg.student._id,
        studentId: studentReg.student.studentId,
        firstName: studentReg.student.firstName,
        lastName: studentReg.student.lastName,
        grade: studentReg.student.grade,
        class: studentReg.student.class,
        status: studentReg.status
      })),
      registrationDate: registration.registrationDate,
      status: registration.status
    }));

    // Get total count of registered students
    const totalStudents = registeredStudents.reduce((count, reg) => count + reg.students.length, 0);

    res.json({
      totalStudents,
      registrations: registeredStudents
    });
  } catch (error) {
    console.error('Get competition registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch competition registrations' });
  }
});

// Get all registrations (admin only)
router.get('/', async (req, res) => {
  try {
    // Check if user is admin
    if (req.teacher.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { competitionId, status } = req.query;
    
    const filter = {};
    if (competitionId) filter.competition = competitionId;
    if (status) filter.status = status;

    const registrations = await Registration.find(filter)
      .populate('competition', 'name category')
      .populate('teacher', 'firstName lastName department')
      .populate('students.student', 'firstName lastName studentId grade class')
      .sort({ registrationDate: -1 });

    res.json(registrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Delete/Cancel registration
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const registrationId = req.params.id;
    const teacherId = req.teacher._id;

    const registration = await Registration.findById(registrationId)
      .populate('competition', 'name registrationDeadline status');

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Check ownership (or admin)
    if (registration.teacher.toString() !== teacherId.toString() && req.teacher.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied - You can only cancel your own registrations' });
    }

    // Check if cancellation is allowed
    if (new Date() > new Date(registration.competition.registrationDeadline)) {
      return res.status(400).json({ 
        error: `Cannot cancel registration after deadline. The registration deadline for ${registration.competition.name} was ${new Date(registration.competition.registrationDeadline).toLocaleDateString()}.` 
      });
    }

    if (registration.competition.status !== 'upcoming') {
      return res.status(400).json({ 
        error: `Cannot cancel registration for this competition. The competition "${registration.competition.name}" is no longer accepting cancellations (status: ${registration.competition.status}).` 
      });
    }

    // Store registration data for notification before deletion
    const registrationData = {
      competitionName: registration.competition.name,
      teacherName: `${req.teacher.firstName} ${req.teacher.lastName}`,
      studentCount: registration.students.length
    };

    await Registration.findByIdAndDelete(registrationId);

    // Create professional notification for registration withdrawal
    const withdrawalNotification = {
      type: 'registration',
      title: 'Registration Cancelled',
      message: `Registration for "${registrationData.competitionName}" has been cancelled by ${registrationData.teacherName} (${registrationData.studentCount} student${registrationData.studentCount !== 1 ? 's' : ''})`,
      priority: 'medium',
      metadata: {
        action: 'cancellation',
        competitionName: registrationData.competitionName,
        teacherName: registrationData.teacherName,
        studentCount: registrationData.studentCount,
        cancellationDate: new Date()
      }
    };

    console.log('📨 Withdrawal Notification:', withdrawalNotification);

    res.json({ 
      message: 'Registration cancelled successfully',
      notification: withdrawalNotification
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ error: 'Failed to cancel registration. Please try again or contact support.' });
  }
});

// Check registration availability for students
router.post('/check-availability', async (req, res) => {
  try {
    const { competitionId, studentIds } = req.body;

    // Find conflicting registrations in the SAME competition
    const conflicts = await Registration.find({
      competition: competitionId,
      'students.student': { $in: studentIds }
    })
    .populate('teacher', 'firstName lastName')
    .populate('students.student', 'firstName lastName studentId');

    const conflictMap = {};
    conflicts.forEach(reg => {
      reg.students.forEach(studentReg => {
        if (studentIds.includes(studentReg.student._id.toString())) {
          conflictMap[studentReg.student._id.toString()] = {
            studentName: `${studentReg.student.firstName} ${studentReg.student.lastName}`,
            studentId: studentReg.student.studentId,
            teacherName: `${reg.teacher.firstName} ${reg.teacher.lastName}`
          };
        }
      });
    });

    res.json({
      available: Object.keys(conflictMap).length === 0,
      conflicts: conflictMap
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Check for cross-competition conflicts (for warnings)
router.post('/check-cross-competition-conflicts', async (req, res) => {
  try {
    const { competitionId, studentIds } = req.body;

    // Find students registered in OTHER competitions
    const crossCompetitionConflicts = await Registration.find({
      competition: { $ne: competitionId }, // Different competitions only
      'students.student': { $in: studentIds }
    })
    .populate('competition', 'name')
    .populate('students.student', 'firstName lastName studentId');

    const warnings = [];
    if (crossCompetitionConflicts.length > 0) {
      const conflictMap = {};
      crossCompetitionConflicts.forEach(reg => {
        reg.students.forEach(studentReg => {
          if (studentIds.includes(studentReg.student._id.toString())) {
            const studentKey = studentReg.student._id.toString();
            if (!conflictMap[studentKey]) {
              conflictMap[studentKey] = {
                studentId: studentReg.student._id.toString(),
                studentName: `${studentReg.student.firstName} ${studentReg.student.lastName}`,
                studentIdNumber: studentReg.student.studentId,
                competitions: []
              };
            }
            conflictMap[studentKey].competitions.push(reg.competition.name);
          }
        });
      });

      // Create warning data
      Object.values(conflictMap).forEach(conflict => {
        warnings.push({
          studentId: conflict.studentId,
          studentName: conflict.studentName,
          studentIdNumber: conflict.studentIdNumber,
          competitions: conflict.competitions,
          message: `${conflict.studentName} is already registered in: ${conflict.competitions.join(', ')}`
        });
      });
    }

    res.json({
      hasWarnings: warnings.length > 0,
      warnings
    });
  } catch (error) {
    console.error('Check cross-competition conflicts error:', error);
    res.status(500).json({ error: 'Failed to check cross-competition conflicts' });
  }
});

// Remove student from registration
router.delete('/:registrationId/students/:studentId', authenticateToken, async (req, res) => {
  try {
    const { registrationId, studentId } = req.params;
    const teacherId = req.teacher._id;

    const registration = await Registration.findById(registrationId)
      .populate('competition', 'name registrationDeadline status');

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Check ownership (or admin)
    if (registration.teacher.toString() !== teacherId.toString() && req.teacher.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied - You can only modify your own registrations' });
    }

    // Check if modification is allowed
    if (new Date() > new Date(registration.competition.registrationDeadline)) {
      return res.status(400).json({ 
        error: `Cannot remove students after deadline. The registration deadline for ${registration.competition.name} was ${new Date(registration.competition.registrationDeadline).toLocaleDateString()}.` 
      });
    }

    if (registration.competition.status !== 'upcoming') {
      return res.status(400).json({ 
        error: `Cannot remove students from this competition. The competition "${registration.competition.name}" is no longer accepting modifications (status: ${registration.competition.status}).` 
      });
    }

    // Check if student exists in registration
    const studentIndex = registration.students.findIndex(
      s => s.student.toString() === studentId
    );

    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found in this registration' });
    }

    // Check if this is the last student (don't allow removing the last student)
    if (registration.students.length === 1) {
      return res.status(400).json({ 
        error: 'Cannot remove the last student. Cancel the entire registration instead.' 
      });
    }

    // Store student data for notification before removal
    const removedStudent = registration.students[studentIndex];
    const studentData = {
      studentName: `${removedStudent.student.firstName} ${removedStudent.student.lastName}`,
      studentId: removedStudent.student.studentId,
      competitionName: registration.competition.name,
      teacherName: `${req.teacher.firstName} ${req.teacher.lastName}`
    };

    // Remove the student
    registration.students.splice(studentIndex, 1);
    await registration.save();

    // Populate for response
    await registration.populate([
      { path: 'competition', select: 'name category startDate' },
      { path: 'students.student', select: 'firstName lastName studentId grade class' }
    ]);

    // Create professional notification for student removal
    const removalNotification = {
      type: 'registration',
      title: 'Student Removed from Competition',
      message: `${studentData.studentName} (ID: ${studentData.studentId}) has been removed from "${studentData.competitionName}" by ${studentData.teacherName}`,
      priority: 'medium',
      metadata: {
        action: 'student_removal',
        studentName: studentData.studentName,
        studentId: studentData.studentId,
        competitionName: studentData.competitionName,
        teacherName: studentData.teacherName,
        remainingStudents: registration.students.length,
        removalDate: new Date()
      }
    };

    console.log('📨 Student Removal Notification:', removalNotification);

    res.json({
      message: 'Student removed from registration successfully',
      registration,
      notification: removalNotification
    });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Failed to remove student from registration. Please try again or contact support.' });
  }
});

module.exports = router;
