const express = require('express');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Dashboard summary data
router.get('/dashboard', async (req, res) => {
  try {
    // Get basic counts
    const [totalStudents, totalCompetitions, totalRegistrations, totalTeachers] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Competition.countDocuments({ isActive: true }),
      Registration.countDocuments(),
      Teacher.countDocuments({ isActive: true })
    ]);

    // Get competitions with registration counts
    const competitions = await Competition.find({ isActive: true })
      .select('name category status maxParticipants registrationDeadline')
      .lean();

    const competitionsWithCounts = await Promise.all(
      competitions.map(async (comp) => {
        const registrationCount = await Registration.aggregate([
          { $match: { competition: comp._id } },
          { $unwind: '$students' },
          { $count: 'total' }
        ]);
        
        return {
          ...comp,
          registrationCount: registrationCount[0]?.total || 0
        };
      })
    );

    // Get student participation data
    const studentParticipation = await Registration.aggregate([
      { $unwind: '$students' },
      {
        $group: {
          _id: '$students.student',
          registrationCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: '$student._id',
          studentId: '$student.studentId',
          firstName: '$student.firstName',
          lastName: '$student.lastName',
          grade: '$student.grade',
          class: '$student.class',
          registrationCount: 1
        }
      },
      { $sort: { registrationCount: -1 } }
    ]);

    // Get teacher activity data (only teachers with registrations)
    const teacherActivity = await Registration.aggregate([
      {
        $group: {
          _id: '$teacher',
          registrationCount: { $sum: 1 },
          studentCount: { $sum: { $size: '$students' } }
        }
      },
      {
        $lookup: {
          from: 'teachers',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      { $unwind: '$teacher' },
      {
        $project: {
          _id: '$teacher._id',
          firstName: '$teacher.firstName',
          lastName: '$teacher.lastName',
          email: '$teacher.email',
          department: '$teacher.department',
          subjects: '$teacher.subjects',
          phoneNumber: '$teacher.phoneNumber',
          role: '$teacher.role',
          isActive: '$teacher.isActive',
          registrationCount: 1,
          studentCount: 1
        }
      },
      { $sort: { registrationCount: -1 } }
    ]);

    // Get all teachers and merge with activity data
    const allTeachers = await Teacher.find({ isActive: true })
      .select('firstName lastName email department subjects phoneNumber role isActive')
      .lean();

    // Create a map of teacher activity
    const activityMap = new Map();
    teacherActivity.forEach(teacher => {
      activityMap.set(teacher._id.toString(), teacher);
    });

    // Merge all teachers with activity data
    const completeTeachersList = allTeachers.map(teacher => {
      const activity = activityMap.get(teacher._id.toString());
      return {
        _id: teacher._id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        department: teacher.department,
        subjects: teacher.subjects,
        phoneNumber: teacher.phoneNumber,
        role: teacher.role,
        isActive: teacher.isActive,
        registrationCount: activity ? activity.registrationCount : 0,
        studentCount: activity ? activity.studentCount : 0
      };
    });

    // Get current teacher's registrations count if not admin
    let myRegistrations = 0;
    if (req.teacher.role !== 'admin') {
      myRegistrations = await Registration.countDocuments({ teacher: req.teacher._id });
    }

    // Calculate real participation trends by department/category
    const participationTrends = await Registration.aggregate([
      { $unwind: '$students' },
      {
        $lookup: {
          from: 'competitions',
          localField: 'competition',
          foreignField: '_id',
          as: 'competition'
        }
      },
      { $unwind: '$competition' },
      {
        $group: {
          _id: '$competition.category',
          participantCount: { $sum: 1 },
          uniqueStudents: { $addToSet: '$students.student' }
        }
      },
      {
        $project: {
          category: '$_id',
          participantCount: 1,
          uniqueStudentCount: { $size: '$uniqueStudents' }
        }
      },
      { $sort: { participantCount: -1 } }
    ]);

    // Calculate participation percentages (based on total active students)
    const trendsWithPercentages = participationTrends.map(trend => ({
      ...trend,
      participationRate: totalStudents > 0 ? Math.round((trend.uniqueStudentCount / totalStudents) * 100) : 0
    }));

    // Calculate grade distribution from actual data
    const gradeDistribution = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          grade: '$_id',
          count: 1,
          percentage: {
            $round: [
              { $multiply: [{ $divide: ['$count', totalStudents] }, 100] },
              1
            ]
          }
        }
      },
      { $sort: { grade: 1 } }
    ]);

    res.json({
      stats: {
        totalStudents,
        totalCompetitions,
        totalRegistrations,
        totalTeachers,
        myRegistrations
      },
      summary: {
        totalStudents,
        totalCompetitions,
        totalRegistrations,
        totalTeachers
      },
      competitions: competitionsWithCounts,
      students: studentParticipation,
      teachers: completeTeachersList,
      participationTrends: trendsWithPercentages,
      gradeDistribution: gradeDistribution
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Export data as CSV
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    let data = [];
    let headers = [];
    let filename = '';

    switch (type) {
      case 'students':
        // Enhanced students export with competition details
        const studentsData = await Student.find({ isActive: true })
          .select('studentId firstName lastName grade class email parentContact.phoneNumber')
          .lean();

        // Get competition registrations for each student
        const studentsWithCompetitions = await Promise.all(
          studentsData.map(async (student) => {
            const registrations = await Registration.find({
              'students.student': student._id
            })
            .populate('competition', 'name category status startDate')
            .populate('teacher', 'firstName lastName department')
            .lean();

            const competitions = registrations.map(reg => ({
              competitionName: reg.competition.name,
              category: reg.competition.category,
              status: reg.competition.status,
              startDate: reg.competition.startDate,
              teacherName: `${reg.teacher.firstName} ${reg.teacher.lastName}`,
              teacherDepartment: reg.teacher.department,
              registrationDate: reg.registrationDate
            }));

            return {
              ...student,
              competitions: competitions,
              totalCompetitions: competitions.length
            };
          })
        );

        // Flatten data for CSV export
        data = [];
        studentsWithCompetitions.forEach(student => {
          if (student.competitions.length === 0) {
            // Student with no competitions
            data.push({
              studentId: student.studentId,
              firstName: student.firstName,
              lastName: student.lastName,
              grade: student.grade,
              class: student.class,
              email: student.email,
              parentPhone: student.parentContact?.phoneNumber || '',
              totalCompetitions: 0,
              competitionName: '',
              category: '',
              status: '',
              startDate: '',
              teacherName: '',
              teacherDepartment: '',
              registrationDate: ''
            });
          } else {
            // Student with competitions - one row per competition
            student.competitions.forEach(comp => {
              data.push({
                studentId: student.studentId,
                firstName: student.firstName,
                lastName: student.lastName,
                grade: student.grade,
                class: student.class,
                email: student.email,
                parentPhone: student.parentContact?.phoneNumber || '',
                totalCompetitions: student.totalCompetitions,
                competitionName: comp.competitionName,
                category: comp.category,
                status: comp.status,
                startDate: comp.startDate ? new Date(comp.startDate).toLocaleDateString() : '',
                teacherName: comp.teacherName,
                teacherDepartment: comp.teacherDepartment,
                registrationDate: comp.registrationDate ? new Date(comp.registrationDate).toLocaleDateString() : ''
              });
            });
          }
        });

        headers = [
          'Student ID', 'First Name', 'Last Name', 'Grade', 'Class', 'Email', 'Parent Phone',
          'Total Competitions', 'Competition Name', 'Category', 'Status', 'Start Date',
          'Teacher Name', 'Teacher Department', 'Registration Date'
        ];
        filename = 'students_with_competitions_export.csv';
        break;

      case 'competitions':
        // Enhanced competitions export with full details
        const competitionsData = await Competition.find({ isActive: true })
          .populate('organizer', 'firstName lastName department')
          .lean();

        // Get detailed data for each competition
        const detailedCompetitions = await Promise.all(
          competitionsData.map(async (comp) => {
            // Get all registrations for this competition
            const registrations = await Registration.find({ competition: comp._id })
              .populate('teacher', 'firstName lastName department')
              .populate('students.student', 'firstName lastName studentId grade class')
              .lean();

            // Calculate total participants
            const totalParticipants = registrations.reduce((total, reg) => total + reg.students.length, 0);
            
            // Get unique teachers
            const teachers = registrations.map(reg => reg.teacher).filter(Boolean);
            const uniqueTeachers = teachers.filter((teacher, index, self) => 
              index === self.findIndex(t => t._id.toString() === teacher._id.toString())
            );

            // Get all students
            const allStudents = registrations.flatMap(reg => reg.students.map(s => s.student)).filter(Boolean);

            return {
              competition: comp,
              totalRegistrations: registrations.length,
              totalParticipants,
              teachers: uniqueTeachers,
              students: allStudents,
              registrations
            };
          })
        );

        // Create CSV data
        data = [];
        detailedCompetitions.forEach(item => {
          const comp = item.competition;
          
          // Main competition row
          data.push({
            type: 'COMPETITION',
            competitionName: comp.name,
            category: comp.category,
            status: comp.status,
            startDate: comp.startDate,
            endDate: comp.endDate,
            registrationDeadline: comp.registrationDeadline,
            maxParticipants: comp.maxParticipants,
            actualParticipants: item.totalParticipants,
            totalRegistrations: item.totalRegistrations,
            organizer: comp.organizer ? `${comp.organizer.firstName} ${comp.organizer.lastName}` : '',
            organizerDepartment: comp.organizer?.department || '',
            description: comp.description || '',
            location: comp.location || '',
            requirements: comp.requirements || '',
            prizes: comp.prizes && comp.prizes.length > 0 ? 
              comp.prizes.map(p => `${p.position}: ${p.description} (${p.value})`).join('; ') : 
              ''
          });

          // Teachers rows
          item.teachers.forEach(teacher => {
            data.push({
              type: 'TEACHER',
              competitionName: comp.name,
              category: comp.category,
              teacherName: `${teacher.firstName} ${teacher.lastName}`,
              teacherDepartment: teacher.department,
              studentsRegistered: item.registrations
                .filter(reg => reg.teacher._id.toString() === teacher._id.toString())
                .reduce((total, reg) => total + reg.students.length, 0)
            });
          });

          // Students rows
          item.students.forEach(student => {
            data.push({
              type: 'STUDENT',
              competitionName: comp.name,
              category: comp.category,
              studentId: student.studentId,
              studentName: `${student.firstName} ${student.lastName}`,
              grade: student.grade,
              class: student.class
            });
          });
        });

        headers = [
          'Type', 'Competition Name', 'Category', 'Status', 'Start Date', 'End Date', 
          'Registration Deadline', 'Max Participants', 'Actual Participants', 
          'Total Registrations', 'Organizer', 'Organizer Department', 'Description', 
          'Location', 'Requirements', 'Prizes', 'Teacher Name', 'Teacher Department', 
          'Students Registered', 'Student ID', 'Student Name', 'Grade', 'Class'
        ];
        filename = 'detailed_competitions_export.csv';
        break;

      case 'registrations':
        data = await Registration.find()
          .populate('competition', 'name category')
          .populate('teacher', 'firstName lastName department')
          .populate('students.student', 'firstName lastName studentId grade')
          .lean();
        headers = ['Competition', 'Category', 'Teacher', 'Department', 'Students Count', 'Registration Date', 'Status'];
        filename = 'registrations_export.csv';
        break;

      case 'teachers':
        // Enhanced teachers export with competition and student details
        const teachersData = await Teacher.find({ isActive: true })
          .select('firstName lastName email department subjects phoneNumber hireDate')
          .lean();

        // Get detailed data for each teacher
        const teachersWithDetails = await Promise.all(
          teachersData.map(async (teacher) => {
            const registrations = await Registration.find({ teacher: teacher._id })
              .populate('competition', 'name category status startDate maxParticipants')
              .populate('students.student', 'firstName lastName studentId grade class')
              .lean();

            const competitionDetails = registrations.map(reg => ({
              competitionName: reg.competition.name,
              category: reg.competition.category,
              status: reg.competition.status,
              startDate: reg.competition.startDate,
              maxParticipants: reg.competition.maxParticipants,
              studentsRegistered: reg.students.length,
              registrationDate: reg.registrationDate,
              students: reg.students.map(s => ({
                studentId: s.student.studentId,
                studentName: `${s.student.firstName} ${s.student.lastName}`,
                grade: s.student.grade,
                class: s.student.class
              }))
            }));

            return {
              ...teacher,
              competitions: competitionDetails,
              totalCompetitions: competitionDetails.length,
              totalStudentsManaged: competitionDetails.reduce((total, comp) => total + comp.studentsRegistered, 0)
            };
          })
        );

        // Flatten data for CSV export
        data = [];
        teachersWithDetails.forEach(teacher => {
          if (teacher.competitions.length === 0) {
            // Teacher with no competitions
            data.push({
              firstName: teacher.firstName,
              lastName: teacher.lastName,
              email: teacher.email,
              department: teacher.department,
              subjects: teacher.subjects?.join(', ') || '',
              phoneNumber: teacher.phoneNumber || '',
              hireDate: teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : '',
              totalCompetitions: 0,
              totalStudentsManaged: 0,
              competitionName: '',
              category: '',
              status: '',
              startDate: '',
              maxParticipants: '',
              studentsRegistered: '',
              registrationDate: '',
              studentId: '',
              studentName: '',
              studentGrade: '',
              studentClass: ''
            });
          } else {
            // Teacher with competitions - one row per student per competition
            teacher.competitions.forEach(comp => {
              if (comp.students.length === 0) {
                // Competition with no students
                data.push({
                  firstName: teacher.firstName,
                  lastName: teacher.lastName,
                  email: teacher.email,
                  department: teacher.department,
                  subjects: teacher.subjects?.join(', ') || '',
                  phoneNumber: teacher.phoneNumber || '',
                  hireDate: teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : '',
                  totalCompetitions: teacher.totalCompetitions,
                  totalStudentsManaged: teacher.totalStudentsManaged,
                  competitionName: comp.competitionName,
                  category: comp.category,
                  status: comp.status,
                  startDate: comp.startDate ? new Date(comp.startDate).toLocaleDateString() : '',
                  maxParticipants: comp.maxParticipants,
                  studentsRegistered: comp.studentsRegistered,
                  registrationDate: comp.registrationDate ? new Date(comp.registrationDate).toLocaleDateString() : '',
                  studentId: '',
                  studentName: '',
                  studentGrade: '',
                  studentClass: ''
                });
              } else {
                // Competition with students
                comp.students.forEach(student => {
                  data.push({
                    firstName: teacher.firstName,
                    lastName: teacher.lastName,
                    email: teacher.email,
                    department: teacher.department,
                    subjects: teacher.subjects?.join(', ') || '',
                    phoneNumber: teacher.phoneNumber || '',
                    hireDate: teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : '',
                    totalCompetitions: teacher.totalCompetitions,
                    totalStudentsManaged: teacher.totalStudentsManaged,
                    competitionName: comp.competitionName,
                    category: comp.category,
                    status: comp.status,
                    startDate: comp.startDate ? new Date(comp.startDate).toLocaleDateString() : '',
                    maxParticipants: comp.maxParticipants,
                    studentsRegistered: comp.studentsRegistered,
                    registrationDate: comp.registrationDate ? new Date(comp.registrationDate).toLocaleDateString() : '',
                    studentId: student.studentId,
                    studentName: student.studentName,
                    studentGrade: student.grade,
                    studentClass: student.class
                  });
                });
              }
            });
          }
        });

        headers = [
          'First Name', 'Last Name', 'Email', 'Department', 'Subjects', 'Phone', 'Hire Date',
          'Total Competitions', 'Total Students Managed', 'Competition Name', 'Category', 'Status',
          'Start Date', 'Max Participants', 'Students Registered', 'Registration Date',
          'Student ID', 'Student Name', 'Student Grade', 'Student Class'
        ];
        filename = 'teachers_with_details_export.csv';
        break;

      case 'comprehensive':
        // Comprehensive report with all competition details
        const allCompetitions = await Competition.find({ isActive: true })
          .populate('organizer', 'firstName lastName department')
          .lean();

        data = [];
        
        for (const comp of allCompetitions) {
          // Get all registrations for this competition
          const registrations = await Registration.find({ competition: comp._id })
            .populate('teacher', 'firstName lastName department')
            .populate('students.student', 'firstName lastName studentId grade class')
            .lean();

          // Summary row for competition
          const totalParticipants = registrations.reduce((total, reg) => total + reg.students.length, 0);
          const uniqueTeachers = [...new Set(registrations.map(reg => reg.teacher?._id?.toString()).filter(Boolean))];
          
          data.push({
            section: 'COMPETITION_SUMMARY',
            competitionName: comp.name,
            category: comp.category,
            status: comp.status,
            startDate: comp.startDate ? new Date(comp.startDate).toLocaleDateString() : '',
            endDate: comp.endDate ? new Date(comp.endDate).toLocaleDateString() : '',
            registrationDeadline: comp.registrationDeadline ? new Date(comp.registrationDeadline).toLocaleDateString() : '',
            maxParticipants: comp.maxParticipants,
            actualParticipants: totalParticipants,
            registeredTeachers: uniqueTeachers.length,
            totalRegistrations: registrations.length,
            organizer: comp.organizer ? `${comp.organizer.firstName} ${comp.organizer.lastName}` : '',
            organizerDepartment: comp.organizer?.department || '',
            description: comp.description || '',
            location: comp.location || '',
            prizes: comp.prizes && comp.prizes.length > 0 ? 
              comp.prizes.map(p => `${p.position}: ${p.description} (${p.value})`).join('; ') : 
              ''
          });

          // Detail rows for each registration
          registrations.forEach(reg => {
            reg.students.forEach(studentReg => {
              const student = studentReg.student;
              if (student) {
                data.push({
                  section: 'PARTICIPANT_DETAIL',
                  competitionName: comp.name,
                  category: comp.category,
                  teacherName: reg.teacher ? `${reg.teacher.firstName} ${reg.teacher.lastName}` : '',
                  teacherDepartment: reg.teacher?.department || '',
                  studentId: student.studentId,
                  studentName: `${student.firstName} ${student.lastName}`,
                  grade: student.grade,
                  class: student.class,
                  registrationDate: reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString() : '',
                  registrationStatus: reg.status || 'confirmed'
                });
              }
            });
          });
        }

        headers = [
          'Section', 'Competition Name', 'Category', 'Status', 'Start Date', 'End Date',
          'Registration Deadline', 'Max Participants', 'Actual Participants', 'Registered Teachers',
          'Total Registrations', 'Organizer', 'Organizer Department', 'Description', 'Location', 'Prizes',
          'Teacher Name', 'Teacher Department', 'Student ID', 'Student Name', 'Grade', 'Class',
          'Registration Date', 'Registration Status'
        ];
        filename = 'comprehensive_report.csv';
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    // Generate CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(item => {
      let row = [];
      
      switch (type) {
        case 'students':
          row = [
            item.studentId || '',
            item.firstName || '',
            item.lastName || '',
            item.grade || '',
            item.class || '',
            item.email || '',
            item.parentPhone || '',
            item.totalCompetitions || '',
            `"${item.competitionName || ''}"`,
            item.category || '',
            item.status || '',
            item.startDate || '',
            `"${item.teacherName || ''}"`,
            item.teacherDepartment || '',
            item.registrationDate || ''
          ];
          break;
          
        case 'competitions':
          row = [
            item.type || '',
            `"${item.competitionName || item.name || ''}"`,
            item.category || '',
            item.status || '',
            item.startDate ? new Date(item.startDate).toLocaleDateString() : '',
            item.endDate ? new Date(item.endDate).toLocaleDateString() : '',
            item.registrationDeadline ? new Date(item.registrationDeadline).toLocaleDateString() : '',
            item.maxParticipants || '',
            item.actualParticipants || '',
            item.totalRegistrations || '',
            `"${item.organizer || ''}"`,
            item.organizerDepartment || '',
            `"${item.description || ''}"`,
            `"${item.location || ''}"`,
            `"${item.requirements || ''}"`,
            `"${item.prizes || ''}"`,
            `"${item.teacherName || ''}"`,
            item.teacherDepartment || '',
            item.studentsRegistered || '',
            item.studentId || '',
            `"${item.studentName || ''}"`,
            item.grade || '',
            item.class || ''
          ];
          break;
          
        case 'registrations':
          row = [
            `"${item.competition?.name}"`,
            item.competition?.category,
            `"${item.teacher?.firstName} ${item.teacher?.lastName}"`,
            item.teacher?.department,
            item.students?.length || 0,
            new Date(item.registrationDate).toLocaleDateString(),
            item.status
          ];
          break;
          
        case 'teachers':
          row = [
            item.firstName || '',
            item.lastName || '',
            item.email || '',
            item.department || '',
            `"${item.subjects || ''}"`,
            item.phoneNumber || '',
            item.hireDate || '',
            item.totalCompetitions || '',
            item.totalStudentsManaged || '',
            `"${item.competitionName || ''}"`,
            item.category || '',
            item.status || '',
            item.startDate || '',
            item.maxParticipants || '',
            item.studentsRegistered || '',
            item.registrationDate || '',
            item.studentId || '',
            `"${item.studentName || ''}"`,
            item.studentGrade || '',
            item.studentClass || ''
          ];
          break;

        case 'comprehensive':
          row = [
            item.section || '',
            `"${item.competitionName || ''}"`,
            item.category || '',
            item.status || '',
            item.startDate || '',
            item.endDate || '',
            item.registrationDeadline || '',
            item.maxParticipants || '',
            item.actualParticipants || '',
            item.registeredTeachers || '',
            item.totalRegistrations || '',
            `"${item.organizer || ''}"`,
            item.organizerDepartment || '',
            `"${item.description || ''}"`,
            `"${item.location || ''}"`,
            `"${item.prizes || ''}"`,
            `"${item.teacherName || ''}"`,
            item.teacherDepartment || '',
            item.studentId || '',
            `"${item.studentName || ''}"`,
            item.grade || '',
            item.class || '',
            item.registrationDate || '',
            item.registrationStatus || ''
          ];
          break;
      }
      
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Competition statistics
router.get('/competition-stats', async (req, res) => {
  try {
    const stats = await Competition.aggregate([
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'competition',
          as: 'registrations'
        }
      },
      {
        $addFields: {
          registrationCount: {
            $sum: {
              $map: {
                input: '$registrations',
                as: 'reg',
                in: { $size: '$$reg.students' }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$category',
          competitions: { $sum: 1 },
          totalRegistrations: { $sum: '$registrationCount' },
          avgRegistrations: { $avg: '$registrationCount' }
        }
      },
      {
        $sort: { totalRegistrations: -1 }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Competition stats error:', error);
    res.status(500).json({ error: 'Failed to fetch competition statistics' });
  }
});

module.exports = router;
