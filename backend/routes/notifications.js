const express = require('express');
const notificationService = require('../services/notificationService');
const competitionMonitor = require('../services/competitionMonitor');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const router = express.Router();

// Get notification system status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = {
      notificationService: {
        connectedUsers: notificationService.getConnectedUsersCount(),
        connectedUsersList: notificationService.getConnectedUsers(),
        serverTime: new Date()
      },
      competitionMonitor: competitionMonitor.getStatus(),
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    res.json(status);
  } catch (error) {
    console.error('Get notification status error:', error);
    res.status(500).json({ error: 'Failed to get notification status' });
  }
});

// Send test notification (admin only)
router.post('/test', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { type, title, message, priority } = req.body;

    const testNotification = {
      type: type || 'system',
      title: title || 'Test Notification',
      message: message || 'This is a test notification from the admin panel',
      priority: priority || 'medium',
      metadata: {
        action: 'admin_test',
        adminId: req.teacher._id,
        adminName: `${req.teacher.firstName} ${req.teacher.lastName}`,
        testTime: new Date()
      }
    };

    const result = await notificationService.broadcastToAllTeachers(testNotification);

    res.json({
      message: 'Test notification sent successfully',
      notification: result,
      recipients: result.recipients
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Send announcement notification (admin only)
router.post('/announcement', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { title, message, priority } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const announcement = {
      type: 'announcement',
      title: title,
      message: message,
      priority: priority || 'high',
      metadata: {
        action: 'system_announcement',
        adminId: req.teacher._id,
        adminName: `${req.teacher.firstName} ${req.teacher.lastName}`,
        announcementTime: new Date()
      }
    };

    const result = await notificationService.broadcastToAllTeachers(announcement);

    res.json({
      message: 'Announcement sent successfully',
      notification: result,
      recipients: result.recipients
    });
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({ error: 'Failed to send announcement' });
  }
});

// Trigger manual competition check (admin only)
router.post('/check-competitions', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    await competitionMonitor.triggerManualCheck();
    
    res.json({
      message: 'Manual competition status check triggered',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Manual competition check error:', error);
    res.status(500).json({ error: 'Failed to trigger competition check' });
  }
});

module.exports = router;
