const Competition = require('../models/Competition');
const notificationService = require('./notificationService');

class CompetitionMonitorService {
  constructor() {
    this.checkInterval = 60 * 60 * 1000; // Check every hour
    this.intervalId = null;
    this.checkedCompetitions = new Set(); // Track competitions we've already notified about
  }

  start() {
    console.log('🏆 Starting Competition Monitor Service...');
    
    // Initial check
    this.checkCompetitionStatuses();
    
    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkCompetitionStatuses();
    }, this.checkInterval);
    
    console.log(`✅ Competition Monitor Service started (checking every ${this.checkInterval / 1000 / 60} minutes)`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Competition Monitor Service stopped');
    }
  }

  async checkCompetitionStatuses() {
    try {
      const now = new Date();
      
      // Find competitions that have just ended
      const endedCompetitions = await Competition.find({
        isActive: true,
        endDate: { $lte: now },
        status: { $ne: 'ended' } // Not already marked as ended
      }).populate('organizer', 'firstName lastName');

      for (const competition of endedCompetitions) {
        // Only notify once per competition
        if (!this.checkedCompetitions.has(competition._id.toString())) {
          await this.handleCompetitionEnded(competition);
          this.checkedCompetitions.add(competition._id.toString());
        }
      }

      // Find competitions with registration deadlines that have passed
      const registrationClosedCompetitions = await Competition.find({
        isActive: true,
        registrationDeadline: { $lte: now },
        status: 'open'
      }).populate('organizer', 'firstName lastName');

      for (const competition of registrationClosedCompetitions) {
        await this.handleRegistrationClosed(competition);
      }

      if (endedCompetitions.length > 0 || registrationClosedCompetitions.length > 0) {
        console.log(`📊 Competition Status Check: ${endedCompetitions.length} ended, ${registrationClosedCompetitions.length} registration closed`);
      }

    } catch (error) {
      console.error('❌ Error checking competition statuses:', error);
    }
  }

  async handleCompetitionEnded(competition) {
    try {
      // Update competition status
      competition.status = 'ended';
      await competition.save();

      // Send notification to all teachers and admins
      await notificationService.broadcastCompetitionUpdate(competition, 'ended');
      
      console.log(`🏁 Competition "${competition.name}" has ended - notification sent to all users`);
    } catch (error) {
      console.error(`❌ Error handling ended competition ${competition.name}:`, error);
    }
  }

  async handleRegistrationClosed(competition) {
    try {
      // Update competition status
      competition.status = 'registration_closed';
      await competition.save();

      // Send notification about registration deadline
      const notification = {
        type: 'competition',
        title: 'Registration Deadline Passed',
        message: `Registration deadline for "${competition.name}" has passed. The competition will begin soon.`,
        priority: 'medium',
        metadata: {
          action: 'registration_closed',
          competitionId: competition._id,
          competitionName: competition.name,
          category: competition.category,
          startDate: competition.startDate,
          endDate: competition.endDate
        }
      };

      await notificationService.broadcastToAllTeachers(notification);
      
      console.log(`⏰ Registration closed for "${competition.name}" - notification sent to all users`);
    } catch (error) {
      console.error(`❌ Error handling registration closure for ${competition.name}:`, error);
    }
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('🔄 Manual competition status check triggered');
    await this.checkCompetitionStatuses();
  }

  // Get service status
  getStatus() {
    return {
      active: this.intervalId !== null,
      checkInterval: this.checkInterval,
      checkedCompetitions: this.checkedCompetitions.size,
      nextCheck: this.intervalId ? new Date(Date.now() + this.checkInterval) : null
    };
  }
}

// Singleton instance
const competitionMonitor = new CompetitionMonitorService();

module.exports = competitionMonitor;
