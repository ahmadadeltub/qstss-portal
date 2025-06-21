import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'registration' | 'competition' | 'system' | 'general' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: {
    action?: 'registration' | 'cancellation' | 'student_removal' | 'deadline_reminder' | 'status_change';
    competitionId?: string;
    competitionName?: string;
    teacherId?: string;
    teacherName?: string;
    studentCount?: number;
    students?: Array<{
      id: string;
      name: string;
      studentId: string;
      grade: string;
    }>;
    registrationId?: string;
    hasWarnings?: boolean;
    warnings?: string[];
    [key: string]: any;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  addRegistrationNotification: (data: any) => void;
  addWithdrawalNotification: (data: any) => void;
  addStudentRemovalNotification: (data: any) => void;
  addCompetitionNotification: (data: any) => void;
  resetNotifications: () => void;
  getNotificationsByType: (type: string) => Notification[];
  getUnreadNotificationsByType: (type: string) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // Function to get initial notifications from localStorage or use default
  const getInitialNotifications = (): Notification[] => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        // Convert timestamp strings back to Date objects
        return parsed.map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
    }
    
    // Default notifications if none saved
    return [
      {
        id: '1',
        title: 'New Student Registration',
        message: 'Ahmed Ali has been registered for Science Competition by Ms. Sarah Johnson',
        type: 'registration',
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        read: false,
        priority: 'medium'
      },
      {
        id: '2',
        title: 'Competition Deadline Reminder',
        message: 'Math Olympics registration closes in 2 days. Current registrations: 15 students',
        type: 'competition',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        read: false,
        priority: 'high'
      },
      {
        id: '3',
        title: 'System Update',
        message: 'New features have been added to the portal including enhanced student search and reporting capabilities',
        type: 'system',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        read: true,
        priority: 'low'
      },
      {
        id: '4',
        title: 'Competition Results',
        message: 'Results for Qatar Science Fair 2025 have been published. Check the competitions page for details.',
        type: 'competition',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        priority: 'medium'
      },
      {
        id: '5',
        title: 'New Teacher Account',
        message: 'Welcome to the Qatar STSS Teacher Portal! Your account has been successfully created.',
        type: 'general',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        read: true,
        priority: 'low'
      }
    ];
  };

  const [notifications, setNotifications] = useState<Notification[]>(getInitialNotifications);

  // Listen for real-time notifications from API calls
  useEffect(() => {
    const handleNewNotification = (event: any) => {
      const { type, data } = event.detail;
      
      switch (type) {
        case 'registration':
          addRegistrationNotification(data.metadata || data);
          break;
        case 'withdrawal':
          addWithdrawalNotification(data.metadata || data);
          break;
        case 'student_removal':
          addStudentRemovalNotification(data.metadata || data);
          break;
        case 'competition':
          addCompetitionNotification(data.metadata || data);
          break;
        default:
          console.log('Unknown notification type:', type);
      }
    };

    window.addEventListener('newNotification', handleNewNotification);
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Professional notification templates for different actions
  const addRegistrationNotification = (data: any) => {
    const studentNames = data.students?.map((s: any) => s.name).join(', ') || 'Students';
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: '✅ New Student Registration',
      message: `${studentNames} successfully registered for "${data.competitionName}" by ${data.teacherName}`,
      type: 'registration',
      priority: data.hasWarnings ? 'medium' : 'low',
      read: false,
      metadata: data
    };
    addNotification(notification);
  };

  const addWithdrawalNotification = (data: any) => {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: '❌ Registration Cancelled',
      message: `Registration for "${data.competitionName}" cancelled by ${data.teacherName} (${data.studentCount} student${data.studentCount !== 1 ? 's' : ''})`,
      type: 'registration',
      priority: 'medium',
      read: false,
      metadata: data
    };
    addNotification(notification);
  };

  const addStudentRemovalNotification = (data: any) => {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: '👤 Student Removed',
      message: `${data.studentName} removed from "${data.competitionName}" by ${data.teacherName}`,
      type: 'registration',
      priority: 'medium',
      read: false,
      metadata: data
    };
    addNotification(notification);
  };

  const addCompetitionNotification = (data: any) => {
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      title: data.title || '🏆 Competition Update',
      message: data.message,
      type: 'competition',
      priority: data.priority || 'medium',
      read: false,
      metadata: data
    };
    addNotification(notification);
  };

  const getNotificationsByType = (type: string): Notification[] => {
    return notifications.filter(n => n.type === type);
  };

  const getUnreadNotificationsByType = (type: string): Notification[] => {
    return notifications.filter(n => n.type === type && !n.read);
  };

  const resetNotifications = () => {
    try {
      localStorage.removeItem('notifications');
      setNotifications(getInitialNotifications());
    } catch (error) {
      console.error('Error resetting notifications:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    addNotification,
    addRegistrationNotification,
    addWithdrawalNotification,
    addStudentRemovalNotification,
    addCompetitionNotification,
    resetNotifications,
    getNotificationsByType,
    getUnreadNotificationsByType
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
