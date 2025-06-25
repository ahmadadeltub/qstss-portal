import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotifications } from '../contexts/NotificationContext';

let socket: Socket | null = null;

export const useRealTimeNotifications = (userId?: string) => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Initialize socket connection
    const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:4000';
    
    if (!socket) {
      socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true
      });

      socket.on('connect', () => {
        console.log('🔔 Connected to notification service:', socket?.id);
        
        // Authenticate the user if userId is provided
        if (userId && socket) {
          socket.emit('authenticate', { userId });
          console.log('✅ User authenticated for notifications:', userId);
        }
      });

      socket.on('disconnect', () => {
        console.log('❌ Disconnected from notification service');
      });

      socket.on('connect_error', (error) => {
        console.error('🔌 Notification service connection error:', error);
      });
    }

    // Listen for broadcast notifications (sent to all users)
    const handleBroadcastNotification = (notification: any) => {
      console.log('📢 Received broadcast notification:', notification);
      
      // Add notification to context
      addNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        priority: notification.priority,
        metadata: notification.metadata
      });

      // Show browser notification if permission granted
      showBrowserNotification(notification);
    };

    // Listen for personal notifications (sent to specific user)
    const handlePersonalNotification = (notification: any) => {
      console.log('👤 Received personal notification:', notification);
      
      // Add notification to context
      addNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        priority: notification.priority,
        metadata: notification.metadata
      });

      // Show browser notification if permission granted
      showBrowserNotification(notification);
    };

    if (socket) {
      socket.on('new_notification', handleBroadcastNotification);
      socket.on('personal_notification', handlePersonalNotification);
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.off('new_notification', handleBroadcastNotification);
        socket.off('personal_notification', handlePersonalNotification);
      }
    };
  }, [userId, addNotification]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Browser notification permission:', permission);
      return permission;
    }
    return 'denied';
  };

  // Show browser notification
  const showBrowserNotification = (notification: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'high' || notification.priority === 'urgent'
      });

      // Auto close after 5 seconds unless it's high priority
      if (notification.priority !== 'high' && notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    }
  };

  // Send test notification (for debugging)
  const sendTestNotification = () => {
    if (socket) {
      socket.emit('test_notification', {
        message: 'Test notification from frontend',
        timestamp: new Date()
      });
    }
  };

  // Get connection status
  const getConnectionStatus = () => {
    return {
      connected: socket?.connected || false,
      id: socket?.id || null,
      userId: userId || null
    };
  };

  return {
    requestNotificationPermission,
    sendTestNotification,
    getConnectionStatus,
    socket
  };
};
