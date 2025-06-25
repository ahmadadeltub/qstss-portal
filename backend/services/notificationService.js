const Teacher = require('../models/Teacher');

class NotificationService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map of userId -> socketId
  }

  // Initialize Socket.IO
  initialize(io) {
    this.io = io;
    console.log('🔔 Notification Service initialized');

    this.io.on('connection', (socket) => {
      console.log(`👤 User connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data) => {
        if (data.userId) {
          this.connectedUsers.set(data.userId, socket.id);
          socket.userId = data.userId;
          console.log(`✅ User authenticated: ${data.userId} -> ${socket.id}`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`👋 User disconnected: ${socket.userId}`);
        }
      });
    });
  }

  // Send notification to all teachers and admins
  async broadcastToAllTeachers(notification) {
    try {
      // Get all active teachers and admins
      const teachers = await Teacher.find({ isActive: true }).select('_id firstName lastName email role');
      
      console.log(`📢 Broadcasting notification to ${teachers.length} teachers/admins`);
      
      // Enhanced notification with timestamp and unique ID
      const enhancedNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification,
        timestamp: new Date(),
        recipients: teachers.length,
        broadcast: true
      };

      // Send to all connected users
      if (this.io) {
        this.io.emit('new_notification', enhancedNotification);
        console.log(`✅ Notification broadcasted to all connected users`);
      }

      // Also send to specific connected teachers
      teachers.forEach(teacher => {
        const socketId = this.connectedUsers.get(teacher._id.toString());
        if (socketId && this.io) {
          this.io.to(socketId).emit('personal_notification', {
            ...enhancedNotification,
            recipientName: `${teacher.firstName} ${teacher.lastName}`,
            recipientRole: teacher.role
          });
        }
      });

      return enhancedNotification;
    } catch (error) {
      console.error('❌ Error broadcasting notification:', error);
      throw error;
    }
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    try {
      const socketId = this.connectedUsers.get(userId);
      
      if (socketId && this.io) {
        const enhancedNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...notification,
          timestamp: new Date(),
          personal: true
        };

        this.io.to(socketId).emit('personal_notification', enhancedNotification);
        console.log(`✅ Personal notification sent to user: ${userId}`);
        return enhancedNotification;
      } else {
        console.log(`⚠️ User ${userId} not connected`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error sending personal notification:', error);
      throw error;
    }
  }

  // Send competition update notification
  async broadcastCompetitionUpdate(competition, action) {
    const notification = {
      type: 'competition',
      title: 'Competition Update',
      message: this.getCompetitionMessage(competition, action),
      priority: action === 'created' ? 'high' : 'medium',
      metadata: {
        action: action,
        competitionId: competition._id,
        competitionName: competition.name,
        category: competition.category,
        startDate: competition.startDate,
        endDate: competition.endDate,
        maxParticipants: competition.maxParticipants
      }
    };

    return await this.broadcastToAllTeachers(notification);
  }

  // Send registration notification
  async broadcastRegistrationNotification(registration, action = 'created') {
    const studentNames = registration.students.map(s => 
      `${s.student.firstName} ${s.student.lastName}`
    ).join(', ');
    
    const teacherName = `${registration.teacher.firstName} ${registration.teacher.lastName}`;
    
    const notification = {
      type: 'registration',
      title: this.getRegistrationTitle(action),
      message: this.getRegistrationMessage(studentNames, registration.competition.name, teacherName, action, registration.students.length),
      priority: 'medium',
      metadata: {
        action: action,
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
        registrationDate: registration.registrationDate
      }
    };

    return await this.broadcastToAllTeachers(notification);
  }

  // Helper methods for message generation
  getCompetitionMessage(competition, action) {
    switch (action) {
      case 'created':
        return `🏆 New competition "${competition.name}" has been added! Registration is now open.`;
      case 'updated':
        return `📝 Competition "${competition.name}" has been updated. Check the latest details.`;
      case 'ended':
        return `🏁 Competition "${competition.name}" has ended. Results will be available soon.`;
      case 'cancelled':
        return `❌ Competition "${competition.name}" has been cancelled.`;
      default:
        return `📢 Competition "${competition.name}" status updated.`;
    }
  }

  getRegistrationTitle(action) {
    switch (action) {
      case 'created':
        return '✅ New Student Registration';
      case 'cancelled':
        return '❌ Registration Cancelled';
      case 'student_removed':
        return '👤 Student Removed';
      default:
        return '📝 Registration Update';
    }
  }

  getRegistrationMessage(studentNames, competitionName, teacherName, action, studentCount) {
    switch (action) {
      case 'created':
        return `${studentNames} ${studentCount === 1 ? 'has' : 'have'} been successfully registered for "${competitionName}" by ${teacherName}`;
      case 'cancelled':
        return `Registration for "${competitionName}" cancelled by ${teacherName} (${studentCount} ${studentCount === 1 ? 'student' : 'students'})`;
      case 'student_removed':
        return `${studentNames} removed from "${competitionName}" by ${teacherName}`;
      default:
        return `Registration update for "${competitionName}" by ${teacherName}`;
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.entries());
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
