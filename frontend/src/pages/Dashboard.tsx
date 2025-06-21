import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  EmojiEvents as CompetitionIcon,
  Assignment as RegistrationIcon,
  School as SchoolIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { useNotifications } from '../contexts/NotificationContext';

interface Stats {
  totalTeachers?: number;
  totalStudents?: number;
  totalCompetitions?: number;
  totalRegistrations?: number;
  myRegistrations?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification, markAllAsRead, unreadCount, resetNotifications } = useNotifications();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiService.getDashboardStats();
        setStats(response.stats);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const testAddNotification = () => {
    addNotification({
      title: 'Test Notification',
      message: 'This is a test notification to demonstrate the dynamic badge count',
      type: 'general',
      read: false,
      priority: 'medium'
    });
  };

  const StatCard: React.FC<{
    title: string;
    value: number | undefined;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" sx={{ color }}>
              {loading ? <CircularProgress size={24} /> : value || 0}
            </Typography>
          </Box>
          <Box sx={{ color, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome back, {user?.firstName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Here's what's happening in your portal today.
      </Typography>

      <Grid container spacing={3}>
        {user?.role === 'admin' ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Teachers"
                value={stats.totalTeachers || 0}
                icon={<SchoolIcon sx={{ fontSize: 40 }} />}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Students"
                value={stats.totalStudents || 0}
                icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                color="#388e3c"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Competitions"
                value={stats.totalCompetitions || 0}
                icon={<CompetitionIcon sx={{ fontSize: 40 }} />}
                color="#f57c00"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Registrations"
                value={stats.totalRegistrations || 0}
                icon={<RegistrationIcon sx={{ fontSize: 40 }} />}
                color="#7b1fa2"
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="My Registrations"
                value={stats.myRegistrations || 0}
                icon={<RegistrationIcon sx={{ fontSize: 40 }} />}
                color="#1976d2"
              />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Navigate to different sections using the sidebar menu:
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • <strong>Students:</strong> Browse and search through all students
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • <strong>Competitions:</strong> View available competitions and register students
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • <strong>My Registrations:</strong> Manage your competition registrations
              </Typography>
              <Typography variant="body2">
                • <strong>Reports:</strong> Generate and view detailed reports
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Notification Test Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              🔔 Notification Badge Test
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Current unread notifications: <strong>{unreadCount}</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={testAddNotification}
                startIcon={<NotificationsIcon />}
              >
                Add Test Notification
              </Button>
              <Button
                variant="outlined"
                onClick={markAllAsRead}
                color="secondary"
              >
                Mark All as Read
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetNotifications}
                color="warning"
              >
                Reset Notifications
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
