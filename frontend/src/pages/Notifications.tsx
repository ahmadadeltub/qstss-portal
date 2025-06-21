import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  Avatar,
  Tabs,
  Tab,
  Badge,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  EmojiEvents as CompetitionIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  PersonAdd as RegistrationIcon,
  PersonRemove as RemovalIcon,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';

const Notifications: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification, 
    markAllAsRead,
    getNotificationsByType,
    getUnreadNotificationsByType
  } = useNotifications();

  const getNotificationIcon = (type: string, metadata?: any) => {
    switch (type) {
      case 'registration':
        if (metadata?.action === 'cancellation') return <RemovalIcon />;
        if (metadata?.action === 'student_removal') return <RemovalIcon />;
        return <RegistrationIcon />;
      case 'competition': return <CompetitionIcon />;
      case 'system': return <SettingsIcon />;
      case 'warning': return <WarningIcon />;
      case 'success': return <SuccessIcon />;
      case 'error': return <ErrorIcon />;
      default: return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'error';
    switch (type) {
      case 'registration': return 'primary';
      case 'competition': return 'secondary';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'error': return 'error';
      case 'system': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const filterNotifications = () => {
    switch (tabValue) {
      case 0: return notifications; // All
      case 1: return notifications.filter(n => !n.read); // Unread
      case 2: return notifications.filter(n => n.read); // Read
      default: return notifications;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Stay updated with the latest activities and announcements in the portal.
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button 
            variant="outlined" 
            onClick={markAllAsRead}
            startIcon={<MarkReadIcon />}
          >
            Mark All as Read
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Badge badgeContent={notifications.length} color="primary">
                All Notifications
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={unreadCount} color="error">
                Unread
              </Badge>
            } 
          />
          <Tab label="Read" />
        </Tabs>

        <List>
          {filterNotifications().map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{
                  bgcolor: notification.read ? 'inherit' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <ListItemIcon>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${getNotificationColor(notification.type, notification.priority)}.main`,
                      width: 40,
                      height: 40
                    }}
                  >
                    {getNotificationIcon(notification.type, notification.metadata)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={notification.read ? 'normal' : 'bold'}
                      >
                        {notification.title}
                      </Typography>
                      <Chip 
                        label={notification.priority} 
                        size="small" 
                        color={getPriorityColor(notification.priority) as any}
                        variant="outlined"
                      />
                      {!notification.read && (
                        <Chip label="NEW" size="small" color="error" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(notification.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
                <Box display="flex" flexDirection="column" gap={1}>
                  {!notification.read && (
                    <IconButton 
                      size="small" 
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <MarkReadIcon />
                    </IconButton>
                  )}
                  <IconButton 
                    size="small" 
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete notification"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
              {index < filterNotifications().length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {filterNotifications().length === 0 && (
          <Box p={4} textAlign="center">
            <NotificationsIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 1 ? 'All notifications have been read' : 'Check back later for updates'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Notifications;
