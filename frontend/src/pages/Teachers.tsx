import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, Button, LinearProgress, Avatar,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, TextField, Alert, Badge,
  useTheme, Fab, Divider, List, ListItem, ListItemText, ListItemAvatar,
  FormControlLabel, Switch, Snackbar
} from '@mui/material';
import {
  School, EmojiEvents, People, TrendingUp, PersonAdd,
  Analytics, Assessment, Email, Phone, Business,
  CheckCircle, Error as ErrorIcon, Info, Refresh,
  FilterList, Download, MoreVert, Group, Star,
  CalendarToday, WorkOutline, SupervisorAccount
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  subjects: string[];
  phoneNumber?: string;
  role: 'teacher' | 'admin';
  isActive: boolean;
  hireDate?: string;
  registrationCount: number;
  studentCount: number;
  totalCompetitions: number;
  activeCompetitions: number;
  recentActivity?: {
    lastRegistration?: string;
    lastLogin?: string;
  };
}

interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  totalRegistrations: number;
  averageStudentsPerTeacher: number;
  topPerformerCount: number;
  departmentDistribution: { [key: string]: number };
}

interface Competition {
  _id: string;
  name: string;
  category: string;
  status: string;
  registrationCount: number;
  startDate: string;
}

const Teachers: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addTeacherDialogOpen, setAddTeacherDialogOpen] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });
  
  // Add teacher form state
  const [teacherForm, setTeacherForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    department: '',
    subjects: [] as string[],
    phoneNumber: '',
    role: 'teacher' as 'teacher' | 'admin',
    isActive: true
  });

  const [addingTeacher, setAddingTeacher] = useState(false);

  const subjectsList = ['Algebra', 'Geometry', 'Biology', 'Chemistry', 'Physics', 'Literature', 'Writing', 'Grammar', 'History', 'Geography', 'Art', 'Music', 'PE'];

  const fetchTeachersData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Fetch teachers with enhanced data
      const teachersResponse = await apiService.get('/reports/dashboard');
      const teachers = teachersResponse.teachers || [];
      
      // Calculate teacher statistics
      const stats: TeacherStats = {
        totalTeachers: teachers.length,
        activeTeachers: teachers.filter((t: Teacher) => t.isActive).length,
        totalRegistrations: teachers.reduce((sum: number, t: Teacher) => sum + t.registrationCount, 0),
        averageStudentsPerTeacher: teachers.length > 0 ? 
          Math.round(teachers.reduce((sum: number, t: Teacher) => sum + t.studentCount, 0) / teachers.length) : 0,
        topPerformerCount: teachers.filter((t: Teacher) => t.registrationCount >= 3).length,
        departmentDistribution: teachers.reduce((acc: any, teacher: Teacher) => {
          acc[teacher.department] = (acc[teacher.department] || 0) + 1;
          return acc;
        }, {})
      };

      // Get competitions data
      const competitionsResponse = await apiService.get('/competitions');
      const competitionsData = Array.isArray(competitionsResponse) ? 
        competitionsResponse : (competitionsResponse.competitions || []);

      setTeachers(teachers);
      setTeacherStats(stats);
      setCompetitions(competitionsData);
    } catch (err: any) {
      console.error('❌ Error fetching teachers data:', err);
      setError('Failed to load teachers data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachersData();
  }, [fetchTeachersData]);

  const getPerformanceLevel = (teacher: Teacher) => {
    if (teacher.registrationCount >= 5) return { level: 'Excellent', color: 'success' as const };
    if (teacher.registrationCount >= 3) return { level: 'Good', color: 'primary' as const };
    if (teacher.registrationCount >= 1) return { level: 'Active', color: 'info' as const };
    return { level: 'New', color: 'default' as const };
  };

  const getDepartmentColor = (department: string) => {
    const colors: { [key: string]: string } = {
      'Mathematics': '#1976d2',
      'Science': '#388e3c',
      'English': '#7b1fa2',
      'Arabic': '#f57c00',
      'History': '#5d4037',
      'Art': '#e91e63',
      'Physical Education': '#00acc1',
      'Administration': '#616161'
    };
    return colors[department] || '#9e9e9e';
  };

  const filteredTeachers = teachers.filter(teacher => {
    if (filterDepartment !== 'all' && teacher.department !== filterDepartment) return false;
    if (filterPerformance !== 'all') {
      const performance = getPerformanceLevel(teacher);
      if (filterPerformance !== performance.level) return false;
    }
    return true;
  });

  const departments = Array.from(new Set(teachers.map(t => t.department)));

  // Add teacher functionality
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetTeacherForm = () => {
    setTeacherForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      department: '',
      subjects: [],
      phoneNumber: '',
      role: 'teacher',
      isActive: true
    });
  };

  const handleOpenAddTeacher = () => {
    resetTeacherForm();
    setAddTeacherDialogOpen(true);
  };

  const handleCreateTeacher = async () => {
    try {
      setAddingTeacher(true);
      await apiService.post('/teachers', teacherForm);
      showSnackbar('Teacher created successfully', 'success');
      setAddTeacherDialogOpen(false);
      resetTeacherForm();
      fetchTeachersData(); // Refresh the data
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to create teacher', 'error');
    } finally {
      setAddingTeacher(false);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    trend?: string;
  }> = ({ title, value, icon, color, subtitle, trend }) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}20`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: 4
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: `${color}20`,
            color: color 
          }}>
            {icon}
          </Box>
          {trend && (
            <Chip 
              label={trend}
              size="small" 
              color={trend.startsWith('+') ? 'success' : 'error'}
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: color, mb: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const openTeacherDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  if (loading && !refreshing) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Box textAlign="center">
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Loading Teachers Dashboard...
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box display="flex" justifyContent="center">
            <Button 
              variant="contained" 
              onClick={fetchTeachersData}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header Section */}
        <Paper elevation={0} sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          borderRadius: 3
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                👨‍🏫 Faculty & Staff
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Qatar Science & Technology Secondary School
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                Comprehensive teacher performance analytics and management dashboard
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton 
                  color="inherit" 
                  onClick={fetchTeachersData}
                  disabled={refreshing}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              {user?.role === 'admin' && (
                <Tooltip title="Add New Teacher">
                  <Fab 
                    color="secondary"
                    size="medium"
                    sx={{ ml: 1 }}
                    onClick={handleOpenAddTeacher}
                  >
                    <PersonAdd />
                  </Fab>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Key Performance Indicators */}
        {teacherStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Total Faculty"
                value={teacherStats.totalTeachers}
                icon={<People sx={{ fontSize: 32 }} />}
                color={theme.palette.primary.main}
                subtitle="Active teaching staff"
                trend="+5.2%"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Active Teachers"
                value={teacherStats.activeTeachers}
                icon={<CheckCircle sx={{ fontSize: 32 }} />}
                color={theme.palette.success.main}
                subtitle="Currently teaching"
                trend="+2.1%"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Total Registrations"
                value={teacherStats.totalRegistrations}
                icon={<EmojiEvents sx={{ fontSize: 32 }} />}
                color={theme.palette.warning.main}
                subtitle="Competition registrations"
                trend="+15.3%"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Avg Students/Teacher"
                value={teacherStats.averageStudentsPerTeacher}
                icon={<TrendingUp sx={{ fontSize: 32 }} />}
                color={theme.palette.info.main}
                subtitle="Student management ratio"
                trend="+8.7%"
              />
            </Grid>
          </Grid>
        )}

        {/* Department Distribution and Top Performers */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Business color="primary" />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Department Distribution
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Faculty distribution across departments
                </Typography>
                {teacherStats && Object.entries(teacherStats.departmentDistribution).map(([dept, count], index) => (
                  <Box key={dept} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{dept}</Typography>
                      <Typography variant="body2">{count} teachers</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(count / teacherStats.totalTeachers) * 100} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getDepartmentColor(dept)
                        }
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Star color="warning" />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Top Performers
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Most active teachers this semester
                </Typography>
                <List dense>
                  {teachers
                    .sort((a, b) => b.registrationCount - a.registrationCount)
                    .slice(0, 5)
                    .map((teacher, index) => (
                    <ListItem key={teacher._id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'grey.400',
                          color: 'black',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${teacher.firstName} ${teacher.lastName}`}
                        secondary={`${teacher.registrationCount} registrations • ${teacher.department}`}
                      />
                      <Badge badgeContent={teacher.registrationCount} color="primary" />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Teachers Directory ({filteredTeachers.length} teachers)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  label="Department"
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Performance</InputLabel>
                <Select
                  value={filterPerformance}
                  onChange={(e) => setFilterPerformance(e.target.value)}
                  label="Performance"
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="Excellent">Excellent</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="New">New</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>

        {/* Teachers Table */}
        <Paper sx={{ width: '100%', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Teacher Profile</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Registrations</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Students</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Performance</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeachers.map((teacher, index) => {
                  const performance = getPerformanceLevel(teacher);
                  return (
                    <TableRow key={teacher._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: getDepartmentColor(teacher.department),
                            width: 40,
                            height: 40
                          }}>
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {teacher.firstName} {teacher.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {teacher.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={teacher.department}
                          size="small"
                          sx={{ 
                            bgcolor: `${getDepartmentColor(teacher.department)}20`,
                            color: getDepartmentColor(teacher.department),
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={teacher.role === 'admin' ? 'Administrator' : 'Teacher'}
                          color={teacher.role === 'admin' ? 'secondary' : 'default'}
                          size="small"
                          icon={teacher.role === 'admin' ? <SupervisorAccount fontSize="small" /> : <School fontSize="small" />}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Badge badgeContent={teacher.registrationCount} color="primary">
                          <Box sx={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%',
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <EmojiEvents fontSize="small" />
                          </Box>
                        </Badge>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {teacher.studentCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={performance.level}
                          color={performance.color}
                          size="small"
                          icon={performance.level === 'Excellent' ? <TrendingUp /> : undefined}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={teacher.isActive ? 'Active' : 'Inactive'}
                          color={teacher.isActive ? 'success' : 'default'}
                          size="small"
                          icon={<CheckCircle fontSize="small" />}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small"
                            onClick={() => openTeacherDetails(teacher)}
                          >
                            <Info />
                          </IconButton>
                        </Tooltip>
                        {user?.role === 'admin' && (
                          <Tooltip title="More Actions">
                            <IconButton size="small">
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Teacher Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: selectedTeacher ? getDepartmentColor(selectedTeacher.department) : 'grey.400',
                width: 56,
                height: 56
              }}>
                {selectedTeacher && `${selectedTeacher.firstName[0]}${selectedTeacher.lastName[0]}`}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {selectedTeacher && `${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTeacher?.department} • {selectedTeacher?.role === 'admin' ? 'Administrator' : 'Teacher'}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedTeacher && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>Contact Information</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{selectedTeacher.email}</Typography>
                    </Box>
                    {selectedTeacher.phoneNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedTeacher.phoneNumber}</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>Performance Metrics</Typography>
                    <Typography variant="body2">
                      <strong>Registrations:</strong> {selectedTeacher.registrationCount}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Students Managed:</strong> {selectedTeacher.studentCount}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Performance Level:</strong> {getPerformanceLevel(selectedTeacher).level}
                    </Typography>
                  </Paper>
                </Grid>
                {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>Subjects Teaching</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedTeacher.subjects.map((subject) => (
                          <Chip 
                            key={subject} 
                            label={subject} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
            {user?.role === 'admin' && (
              <Button variant="contained">Edit Teacher</Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Add Teacher Dialog */}
        <Dialog open={addTeacherDialogOpen} onClose={() => setAddTeacherDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New Teacher</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  required
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  required
                  value={teacherForm.firstName}
                  onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  required
                  value={teacherForm.lastName}
                  onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={teacherForm.department}
                    onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                    label="Department"
                  >
                    {[
                      'STEM Department',
                      'FAB Lab Department', 
                      'Energy Department',
                      'Robotics Department',
                      'Project Research Department',
                      'Electronics Projects Department',
                      'Computer Science Department',
                      'Physics Department',
                      'Mathematics Department',
                      'Arabic Language Department',
                      'Islamic Education Department',
                      'English Language Department',
                      'Virtual Reality (VR) Department',
                      'Augmented Reality (AR) Department',
                      'Social Studies Department',
                      'Physical Education Department',
                      'Design Technology Department',
                      'Library Services Department'
                    ].map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={teacherForm.phoneNumber}
                  onChange={(e) => setTeacherForm({ ...teacherForm, phoneNumber: e.target.value })}
                  placeholder="+974XXXXXXXX"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={teacherForm.role}
                    onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value as 'teacher' | 'admin' })}
                    label="Role"
                  >
                    <MenuItem value="teacher">Teacher</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={teacherForm.isActive}
                      onChange={(e) => setTeacherForm({ ...teacherForm, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Subjects</InputLabel>
                  <Select
                    multiple
                    value={teacherForm.subjects}
                    onChange={(e) => setTeacherForm({ ...teacherForm, subjects: e.target.value as string[] })}
                    label="Subjects"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {subjectsList.map((subject) => (
                      <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddTeacherDialogOpen(false)} disabled={addingTeacher}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeacher}
              variant="contained"
              disabled={addingTeacher || !teacherForm.email || !teacherForm.password || !teacherForm.firstName || !teacherForm.lastName || !teacherForm.department}
              startIcon={addingTeacher ? <CircularProgress size={20} /> : <PersonAdd />}
            >
              {addingTeacher ? 'Creating...' : 'Create Teacher'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Teachers;
