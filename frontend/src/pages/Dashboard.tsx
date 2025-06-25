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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  People as PeopleIcon,
  EmojiEvents as CompetitionIcon,
  Assignment as RegistrationIcon,
  School as SchoolIcon,
  Notifications as NotificationsIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Person as PersonIcon,
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

interface Competition {
  _id: string;
  name: string;
  description: string;
  category: string;
  maxStudentsPerTeacher: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  eligibleGrades: string[];
  status: string;
}

interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  grade: string;
  class: string;
  email: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification, markAllAsRead, unreadCount, resetNotifications } = useNotifications();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Competition registration states
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // My Registrations states
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [deletingRegistration, setDeletingRegistration] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Competition Details Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRegistrationDetails, setSelectedRegistrationDetails] = useState<any>(null);

  // Add Students Dialog states
  const [addStudentsDialogOpen, setAddStudentsDialogOpen] = useState(false);
  const [selectedRegistrationForAdd, setSelectedRegistrationForAdd] = useState<any>(null);
  const [additionalStudents, setAdditionalStudents] = useState<string[]>([]);
  const [addingStudents, setAddingStudents] = useState(false);

  // Cross-competition conflict states
  const [crossCompetitionWarnings, setCrossCompetitionWarnings] = useState<any[]>([]);
  const [loadingConflictCheck, setLoadingConflictCheck] = useState(false);

  // Student Registrations Report states
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [loadingAllRegistrations, setLoadingAllRegistrations] = useState(false);

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
    
    // Fetch competitions and students for teachers and admins
    if (user?.role === 'teacher' || user?.role === 'admin') {
      fetchCompetitions();
      fetchStudents();
      fetchMyRegistrations();
    }
  }, [user]);

  const fetchCompetitions = async () => {
    try {
      const response = await apiService.getCompetitions();
      // Filter competitions that are open for registration
      const openCompetitions = Array.isArray(response) 
        ? response.filter(comp => 
            comp.status === 'upcoming' && 
            new Date() <= new Date(comp.registrationDeadline)
          )
        : [];
      setCompetitions(openCompetitions);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiService.getStudents({ limit: 1000 });
      setStudents(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchMyRegistrations = async () => {
    setLoadingRegistrations(true);
    try {
      const registrations = await apiService.getMyRegistrations();
      setMyRegistrations(Array.isArray(registrations) ? registrations : []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setAlert({ type: 'error', message: 'Failed to load registrations' });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const fetchAllRegistrations = async () => {
    setLoadingAllRegistrations(true);
    try {
      const response = await apiService.get('/registrations/report');
      console.log('API Response:', response); // Debug logging
      
      // Filter out any null or invalid registrations
      const validRegistrations = Array.isArray(response) 
        ? response.filter(reg => {
            const isValid = reg && reg.competition && reg.teacher && reg.students;
            if (!isValid) {
              console.log('Filtered out invalid registration:', reg);
            }
            return isValid;
          })
        : [];
      
      console.log('Valid registrations:', validRegistrations); // Debug logging
      setAllRegistrations(validRegistrations);
    } catch (error) {
      console.error('Error fetching all registrations:', error);
      setAlert({ type: 'error', message: 'Failed to load registrations report' });
    } finally {
      setLoadingAllRegistrations(false);
    }
  };

  const handleCompetitionChange = (event: SelectChangeEvent) => {
    setSelectedCompetition(event.target.value as string);
    setSelectedStudents([]);
  };

  const handleStudentSelection = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const newSelection = typeof value === 'string' ? value.split(',') : value;
    setSelectedStudents(newSelection);
    
    // Check for cross-competition conflicts when students are selected
    if (newSelection.length > 0 && selectedCompetition) {
      checkMainRegistrationConflicts(newSelection);
    } else {
      setCrossCompetitionWarnings([]);
    }
  };

  const checkMainRegistrationConflicts = async (studentIds: string[]) => {
    if (!selectedCompetition || studentIds.length === 0) {
      setCrossCompetitionWarnings([]);
      return;
    }

    setLoadingConflictCheck(true);
    try {
      const response = await apiService.checkCrossCompetitionConflicts(
        selectedCompetition,
        studentIds
      );
      
      if (response.hasWarnings) {
        setCrossCompetitionWarnings(response.warnings);
      } else {
        setCrossCompetitionWarnings([]);
      }
    } catch (error) {
      console.error('Error checking cross-competition conflicts:', error);
      setCrossCompetitionWarnings([]);
    } finally {
      setLoadingConflictCheck(false);
    }
  };

  const handleOpenRegistrationDialog = () => {
    if (!selectedCompetition) {
      setAlert({ type: 'error', message: 'Please select a competition first' });
      return;
    }
    setCrossCompetitionWarnings([]);
    setRegistrationDialogOpen(true);
  };

  const handleRegisterStudents = async () => {
    if (!selectedCompetition || selectedStudents.length === 0) {
      setAlert({ type: 'error', message: 'Please select students to register' });
      return;
    }

    const competition = competitions.find(c => c._id === selectedCompetition);
    if (selectedStudents.length > (competition?.maxStudentsPerTeacher || 4)) {
      setAlert({ 
        type: 'error', 
        message: `You can only register up to ${competition?.maxStudentsPerTeacher} students for this competition` 
      });
      return;
    }

    setRegistering(true);
    try {
      await apiService.registerStudents(selectedCompetition, selectedStudents);
      setAlert({ 
        type: 'success', 
        message: `Successfully registered ${selectedStudents.length} student(s) for the competition!` 
      });
      setRegistrationDialogOpen(false);
      setSelectedStudents([]);
      setSelectedCompetition('');
      // Refresh registrations list
      fetchMyRegistrations();
    } catch (error: any) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to register students' 
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteRegistration = async (registrationId: string, competitionName: string) => {
    setRegistrationToDelete({ id: registrationId, name: competitionName });
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (registration: any) => {
    setSelectedRegistrationDetails(registration);
    setDetailsDialogOpen(true);
  };

  const handleAddStudents = (registration: any) => {
    setSelectedRegistrationForAdd(registration);
    setAdditionalStudents([]);
    setCrossCompetitionWarnings([]);
    setAddStudentsDialogOpen(true);
  };

  const handleAdditionalStudentSelection = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const newSelection = typeof value === 'string' ? value.split(',') : value;
    setAdditionalStudents(newSelection);
    
    // Check for cross-competition conflicts when students are selected
    if (newSelection.length > 0 && selectedRegistrationForAdd) {
      checkCrossCompetitionConflicts(newSelection);
    } else {
      setCrossCompetitionWarnings([]);
    }
  };

  const checkCrossCompetitionConflicts = async (studentIds: string[]) => {
    if (!selectedRegistrationForAdd || studentIds.length === 0) {
      setCrossCompetitionWarnings([]);
      return;
    }

    setLoadingConflictCheck(true);
    try {
      const response = await apiService.checkCrossCompetitionConflicts(
        selectedRegistrationForAdd.competition._id,
        studentIds
      );
      
      if (response.hasWarnings) {
        setCrossCompetitionWarnings(response.warnings);
      } else {
        setCrossCompetitionWarnings([]);
      }
    } catch (error) {
      console.error('Error checking cross-competition conflicts:', error);
      setCrossCompetitionWarnings([]);
    } finally {
      setLoadingConflictCheck(false);
    }
  };

  const handleAddStudentsToRegistration = async () => {
    if (!selectedRegistrationForAdd || additionalStudents.length === 0) {
      setAlert({ type: 'error', message: 'Please select students to add' });
      return;
    }

    const currentStudentCount = selectedRegistrationForAdd.students.length;
    const maxStudents = selectedRegistrationForAdd.competition.maxStudentsPerTeacher || 4;
    
    if (currentStudentCount + additionalStudents.length > maxStudents) {
      setAlert({ 
        type: 'error', 
        message: `Cannot add ${additionalStudents.length} students. Current: ${currentStudentCount}, Max allowed: ${maxStudents}` 
      });
      return;
    }

    setAddingStudents(true);
    try {
      await apiService.addStudentsToRegistration(selectedRegistrationForAdd._id, additionalStudents);
      setAlert({ 
        type: 'success', 
        message: `Successfully added ${additionalStudents.length} student(s) to the competition!` 
      });
      setAddStudentsDialogOpen(false);
      setAdditionalStudents([]);
      setSelectedRegistrationForAdd(null);
      // Refresh registrations list
      fetchMyRegistrations();
    } catch (error: any) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to add students to registration' 
      });
    } finally {
      setAddingStudents(false);
    }
  };

  const confirmDeleteRegistration = async () => {
    if (!registrationToDelete) return;

    setDeletingRegistration(registrationToDelete.id);
    setDeleteDialogOpen(false);
    
    try {
      await apiService.deleteRegistration(registrationToDelete.id);
      setAlert({ 
        type: 'success', 
        message: `Successfully cancelled registration for "${registrationToDelete.name}"` 
      });
      // Refresh registrations list
      fetchMyRegistrations();
    } catch (error: any) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to cancel registration' 
      });
    } finally {
      setDeletingRegistration(null);
      setRegistrationToDelete(null);
    }
  };

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

  const getSelectedCompetition = () => {
    return competitions.find(c => c._id === selectedCompetition);
  };

  const sortedStudents = students.sort((a, b) => {
    if (a.grade !== b.grade) {
      return a.grade.localeCompare(b.grade);
    }
    if (a.class !== b.class) {
      return a.class.localeCompare(b.class);
    }
    return a.lastName.localeCompare(b.lastName);
  });

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

      {/* Alert Messages */}
      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 3 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

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

        {/* Teacher Competition Registration Section */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAddIcon />
                Register Students for Competitions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select a competition and register your students directly from the dashboard.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Competition</InputLabel>
                    <Select
                      value={selectedCompetition}
                      label="Select Competition"
                      onChange={handleCompetitionChange}
                    >
                      {competitions.map((competition) => (
                        <MenuItem key={competition._id} value={competition._id}>
                          <Box>
                            <Typography variant="body1">{competition.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {competition.category} • Max {competition.maxStudentsPerTeacher} students • 
                              Deadline: {new Date(competition.registrationDeadline).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                      {competitions.length === 0 && (
                        <MenuItem disabled>No competitions available for registration</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleOpenRegistrationDialog}
                      disabled={!selectedCompetition}
                      startIcon={<PersonAddIcon />}
                      sx={{ flexShrink: 0 }}
                    >
                      Select Students
                    </Button>
                    {selectedCompetition && getSelectedCompetition() && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Selected:</strong> {getSelectedCompetition()?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Eligible Grades: {getSelectedCompetition()?.eligibleGrades.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {selectedStudents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Selected Students ({selectedStudents.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedStudents.map((studentId) => {
                      const student = students.find(s => s._id === studentId);
                      return student ? (
                        <Chip
                          key={studentId}
                          label={`${student.firstName} ${student.lastName} (${student.grade})`}
                          onDelete={() => {
                            setSelectedStudents(prev => prev.filter(id => id !== studentId));
                          }}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        {/* My Registrations Section for Teachers and Admins */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RegistrationIcon />
                My Registrations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View and manage your current competition registrations.
              </Typography>

              {loadingRegistrations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : myRegistrations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No registrations found. Register students for competitions to see them here.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Competition</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell><strong>Students</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Registration Deadline</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myRegistrations.map((registration) => (
                        <TableRow key={registration._id} hover>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {registration.competition.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(registration.competition.startDate).toLocaleDateString()} - {new Date(registration.competition.endDate).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={registration.competition.category} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {registration.students?.length || 0} student{(registration.students?.length || 0) !== 1 ? 's' : ''}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {registration.students && registration.students.slice(0, 3).map((studentReg: any, index: number) => (
                                  <Chip
                                    key={studentReg.student._id}
                                    label={`${studentReg.student.firstName} ${studentReg.student.lastName}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                                {registration.students && registration.students.length > 3 && (
                                  <Chip
                                    label={`+${registration.students.length - 3} more`}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={registration.competition.status} 
                              size="small"
                              color={
                                registration.competition.status === 'upcoming' ? 'success' : 
                                registration.competition.status === 'ongoing' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimeIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {new Date(registration.competition.registrationDeadline).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleViewDetails(registration)}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Add Students">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleAddStudents(registration)}
                                  disabled={
                                    registration.students.length >= (registration.competition.maxStudentsPerTeacher || 4) ||
                                    new Date() > new Date(registration.competition.registrationDeadline)
                                  }
                                >
                                  <PersonAddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel Registration">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteRegistration(registration._id, registration.competition.name)}
                                  disabled={deletingRegistration === registration._id}
                                >
                                  {deletingRegistration === registration._id ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <DeleteIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        )}

        {/* Student Registrations Report Section for Teachers and Admins */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon />
                Student Registrations Report
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View all students registered for competitions across all teachers.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={fetchAllRegistrations}
                  disabled={loadingAllRegistrations}
                  startIcon={loadingAllRegistrations ? <CircularProgress size={20} /> : <ViewIcon />}
                >
                  {loadingAllRegistrations ? 'Loading Report...' : 'Load Registrations Report'}
                </Button>
              </Box>

              {loadingAllRegistrations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : allRegistrations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No registrations found. Click "Load Registrations Report" to fetch data.
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Student</strong></TableCell>
                          <TableCell><strong>Competition</strong></TableCell>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell><strong>Registered By</strong></TableCell>
                          <TableCell><strong>Registration Date</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allRegistrations.flatMap((registration) => {
                          // Add null checks for all nested properties
                          if (!registration || !registration.competition || !registration.teacher) {
                            return [];
                          }
                          
                          const competition = registration.competition;
                          const teacher = registration.teacher;
                          
                          // Handle students array - can be array of student objects or array of objects with student property
                          const students = registration.students || [];
                             return students.map((student: any, index: number) => {
                          // Students are direct objects, not wrapped in .student property
                          if (!student || !student._id) {
                            return null;
                          }
                          
                          return (
                            <TableRow key={`${registration._id}-${student._id}-${index}`} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    {(student.firstName?.charAt(0) || '?')}{(student.lastName?.charAt(0) || '?')}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body1" fontWeight="medium">
                                      {student.firstName || 'Unknown'} {student.lastName || 'Student'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ID: {student.studentId || 'N/A'} | Grade {student.grade || 'N/A'} | Class {student.class || 'N/A'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body1" fontWeight="medium">
                                      {competition.name || 'Unknown Competition'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {competition.startDate ? new Date(competition.startDate).toLocaleDateString() : 'N/A'} - {competition.endDate ? new Date(competition.endDate).toLocaleDateString() : 'N/A'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={competition.category || 'N/A'} 
                                    size="small" 
                                    variant="outlined"
                                    color="primary"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon fontSize="small" color="action" />
                                    <Box>
                                      <Typography variant="body2" fontWeight="medium">
                                        {teacher.firstName || 'Unknown'} {teacher.lastName || 'Teacher'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        📚 {teacher.department || 'No Department'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        📧 {teacher.email || 'No Email'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TimeIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                      {registration.registrationDate ? new Date(registration.registrationDate).toLocaleDateString() : 'N/A'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={competition.status || 'unknown'} 
                                    size="small"
                                    color={
                                      competition.status === 'upcoming' ? 'success' : 
                                      competition.status === 'ongoing' ? 'warning' : 'default'
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          }).filter(Boolean); // Remove null entries
                        })}
                        {allRegistrations.flatMap(reg => reg.students || []).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                No student registrations found in the loaded data.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {allRegistrations.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    📊 Report Summary:
                  </Typography>
                  <Typography variant="body2">
                    • Total Registrations: <strong>{allRegistrations.length}</strong>
                  </Typography>
                  <Typography variant="body2">
                    • Total Students: <strong>{allRegistrations.reduce((acc, reg) => acc + (reg?.students?.length || 0), 0)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    • Unique Teachers: <strong>{new Set(allRegistrations.filter(reg => reg?.teacher?._id).map(reg => reg.teacher._id)).size}</strong>
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        {/* Notification Test Section - Admin Only */}
        {user?.role === 'admin' && (
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
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          Cancel Registration
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your registration for "{registrationToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. All registered students will be removed from this competition.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Keep Registration</Button>
          <Button 
            onClick={confirmDeleteRegistration}
            variant="contained"
            color="error"
          >
            Yes, Cancel Registration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Selection Dialog */}
      <Dialog open={registrationDialogOpen} onClose={() => setRegistrationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Select Students for {getSelectedCompetition()?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select up to {getSelectedCompetition()?.maxStudentsPerTeacher} students. 
              Competition eligible grades: {getSelectedCompetition()?.eligibleGrades.join(', ')}
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Select Students</InputLabel>
              <Select
                multiple
                value={selectedStudents}
                onChange={handleStudentSelection}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const student = students.find(s => s._id === value);
                      return student ? (
                        <Chip key={value} label={`${student.firstName} ${student.lastName}`} size="small" />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {sortedStudents.reduce((acc, student, index, array) => {
                  // Add grade header
                  if (index === 0 || array[index - 1].grade !== student.grade) {
                    acc.push(
                      <MenuItem key={`grade-${student.grade}`} disabled sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'primary.contrastText',
                        fontWeight: 'bold'
                      }}>
                        📚 Grade {student.grade}
                      </MenuItem>
                    );
                  }
                  
                  // Add the student item
                  acc.push(
                    <MenuItem key={student._id} value={student._id} sx={{ pl: 4 }}>
                      <Checkbox checked={selectedStudents.indexOf(student._id) > -1} />
                      <ListItemText 
                        primary={`${student.firstName} ${student.lastName}`}
                        secondary={`ID: ${student.studentId} | Class: ${student.class}`}
                        sx={{ ml: 1 }}
                      />
                    </MenuItem>
                  );
                  
                  return acc;
                }, [] as React.ReactElement[])}
              </Select>
            </FormControl>

            {selectedStudents.length > (getSelectedCompetition()?.maxStudentsPerTeacher || 4) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You can only register up to {getSelectedCompetition()?.maxStudentsPerTeacher} students per competition.
              </Alert>
            )}

            {/* Cross-Competition Conflict Warnings for Main Registration */}
            {crossCompetitionWarnings.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert 
                  severity="warning" 
                  icon={<WarningIcon />}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    ⚠️ Cross-Competition Registration Detected
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {crossCompetitionWarnings.length} selected student{crossCompetitionWarnings.length !== 1 ? 's are' : ' is'} already registered in other competitions. You can still proceed, but please review potential scheduling conflicts:
                  </Typography>
                  
                  {/* Summary of competitions and teachers */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.lighter', borderRadius: 1, border: '1px solid', borderColor: 'warning.light' }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                      📋 Conflict Summary:
                    </Typography>
                    {crossCompetitionWarnings.map((warning, index) => (
                      <Box key={warning.studentId} sx={{ mb: 1.5 }}>
                        <Typography variant="body2" fontWeight="medium" color="text.primary">
                          👤 {warning.studentName} (ID: {warning.studentIdNumber})
                        </Typography>
                        {warning.registrations && warning.registrations.map((reg: any, regIndex: number) => (
                          <Box key={regIndex} sx={{ ml: 2, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              🏆 <strong>{reg.competitionName}</strong> ({reg.competitionCategory}) - Registered by <strong>{reg.teacherName}</strong> ({reg.teacherDepartment})
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </Alert>

                {crossCompetitionWarnings.map((warning, index) => (
                  <Accordion key={warning.studentId} sx={{ mb: 1 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        bgcolor: 'warning.light',
                        '&:hover': { bgcolor: 'warning.main' },
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Badge badgeContent={warning.competitionsCount} color="error">
                          <PersonIcon color="action" />
                        </Badge>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {warning.studentName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {warning.studentIdNumber} | Grade {warning.studentGrade} | Class {warning.studentClass}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="error">
                          {warning.competitionsCount} conflict{warning.competitionsCount !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This student is already registered in the following competitions:
                      </Typography>
                      
                      {warning.registrations && warning.registrations.map((reg: any, regIndex: number) => (
                        <Paper key={regIndex} sx={{ p: 2, mb: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'warning.light' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <CompetitionIcon fontSize="small" color="primary" />
                                <Typography variant="h6" color="primary" fontWeight="bold">
                                  {reg.competitionName}
                                </Typography>
                                <Chip 
                                  label={reg.competitionCategory} 
                                  size="small" 
                                  variant="outlined"
                                  color="primary"
                                />
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>👨‍🏫 Registered by Teacher</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <PersonIcon fontSize="small" color="action" />
                                <Box>
                                  <Typography variant="body1" fontWeight="bold" color="text.primary">
                                    {reg.teacherName}
                                  </Typography>
                                  {reg.teacherDepartment && (
                                    <Typography variant="caption" color="text.secondary">
                                      📚 {reg.teacherDepartment}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <EmailIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                      {reg.teacherEmail}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>📅 Competition Period</Typography>
                              <Typography variant="body1" sx={{ mt: 0.5, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                {new Date(reg.competitionStartDate).toLocaleDateString()} - {new Date(reg.competitionEndDate).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium', mt: 1 }}>📝 Registration Date</Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {new Date(reg.registrationDate).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            {loadingConflictCheck && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Checking for scheduling conflicts...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegistrationDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRegisterStudents}
            variant="contained"
            disabled={
              registering || 
              selectedStudents.length === 0 || 
              selectedStudents.length > (getSelectedCompetition()?.maxStudentsPerTeacher || 4)
            }
          >
            {registering ? <CircularProgress size={20} /> : 'Register Students'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Competition Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CompetitionIcon color="primary" />
            <Box>
              <Typography variant="h6">
                {selectedRegistrationDetails?.competition?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registration Details
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRegistrationDetails && (
            <Box sx={{ mt: 2 }}>
              {/* Competition Information */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompetitionIcon fontSize="small" />
                Competition Information
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Competition Name</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedRegistrationDetails.competition.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Category</Typography>
                  <Chip 
                    label={selectedRegistrationDetails.competition.category} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedRegistrationDetails.competition.status} 
                    size="small"
                    color={
                      selectedRegistrationDetails.competition.status === 'upcoming' ? 'success' : 
                      selectedRegistrationDetails.competition.status === 'ongoing' ? 'warning' : 'default'
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Registration Deadline</Typography>
                  <Typography variant="body1">
                    {new Date(selectedRegistrationDetails.competition.registrationDeadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Competition Start Date</Typography>
                  <Typography variant="body1">
                    {new Date(selectedRegistrationDetails.competition.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Competition End Date</Typography>
                  <Typography variant="body1">
                    {new Date(selectedRegistrationDetails.competition.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Grid>
              </Grid>

              {selectedRegistrationDetails.competition.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Description</Typography>
                  <Typography variant="body1">
                    {selectedRegistrationDetails.competition.description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Registered Students */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon fontSize="small" />
                Registered Students ({selectedRegistrationDetails.students?.length || 0})
              </Typography>
              
              {selectedRegistrationDetails.students && selectedRegistrationDetails.students.length > 0 ? (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  {selectedRegistrationDetails.students.map((studentReg: any, index: number) => (
                    <React.Fragment key={studentReg.student._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {studentReg.student.firstName[0]}{studentReg.student.lastName[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {studentReg.student.firstName} {studentReg.student.lastName}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Student ID: {studentReg.student.studentId}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip 
                                  label={`Grade ${studentReg.student.grade}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Chip 
                                  label={`Class ${studentReg.student.class}`} 
                                  size="small" 
                                  variant="outlined"
                                  color="secondary"
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                Registered: {new Date(studentReg.registrationDate || selectedRegistrationDetails.registrationDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < selectedRegistrationDetails.students.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No students registered for this competition.
                </Typography>
              )}

              {/* Additional Competition Details */}
              {(selectedRegistrationDetails.competition.eligibleGrades || 
                selectedRegistrationDetails.competition.maxStudentsPerTeacher ||
                selectedRegistrationDetails.competition.registrationDeadline) && (
                <>
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom>Competition Rules & Requirements</Typography>
                  
                  <Grid container spacing={2}>
                    {selectedRegistrationDetails.competition.eligibleGrades && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Eligible Grades</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {selectedRegistrationDetails.competition.eligibleGrades.map((grade: string) => (
                            <Chip 
                              key={grade}
                              label={`Grade ${grade}`} 
                              size="small" 
                              variant="outlined"
                              color="info"
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                    
                    {selectedRegistrationDetails.competition.maxStudentsPerTeacher && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Max Students per Teacher</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedRegistrationDetails.competition.maxStudentsPerTeacher} students
                        </Typography>
                      </Grid>
                    )}
                    
                    {selectedRegistrationDetails.competition.registrationDeadline && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Registration Deadline</Typography>
                        <Typography variant="body1" color={
                          new Date() > new Date(selectedRegistrationDetails.competition.registrationDeadline) 
                            ? 'error.main' 
                            : 'success.main'
                        }>
                          {new Date(selectedRegistrationDetails.competition.registrationDeadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {new Date() > new Date(selectedRegistrationDetails.comcompetition.registrationDeadline) 
                            ? ' (Closed)' 
                            : ' (Open)'
                          }
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Students Dialog */}
      <Dialog 
        open={addStudentsDialogOpen} 
        onClose={() => setAddStudentsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonAddIcon color="primary" />
            <Box>
              <Typography variant="h6">
                Add Students to {selectedRegistrationForAdd?.competition?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select additional students to register for this competition
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRegistrationForAdd && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Current students: <strong>{selectedRegistrationForAdd.students.length}</strong> | 
                Maximum allowed: <strong>{selectedRegistrationForAdd.competition.maxStudentsPerTeacher}</strong> | 
                Available slots: <strong>{selectedRegistrationForAdd.competition.maxStudentsPerTeacher - selectedRegistrationForAdd.students.length}</strong>
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Competition eligible grades: {selectedRegistrationForAdd.competition.eligibleGrades?.join(', ')}
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Select Additional Students</InputLabel>
                <Select
                  multiple
                  value={additionalStudents}
                  onChange={handleAdditionalStudentSelection}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const student = students.find(s => s._id === value);
                        return student ? (
                          <Chip key={value} label={`${student.firstName} ${student.lastName}`} size="small" />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {(() => {
                    // Get available students (not already registered and meeting grade requirements)
                    const availableStudents = sortedStudents.filter(student => {
                      // Filter out students already registered for this competition
                      const alreadyRegistered = selectedRegistrationForAdd.students.some(
                        (registeredStudent: any) => registeredStudent.student._id === student._id
                      );
                      
                      // Filter by eligible grades (if grades are specified)
                      const eligibleGrades = selectedRegistrationForAdd.competition.eligibleGrades || [];
                      const isEligibleGrade = eligibleGrades.length === 0 || eligibleGrades.includes(student.grade);
                      
                      // Only show students who are not already registered AND meet grade requirements
                      return !alreadyRegistered && isEligibleGrade;
                    });

                    // If no students are available, show a message
                    if (availableStudents.length === 0) {
                      return [
                        <MenuItem key="no-students" disabled sx={{ 
                          textAlign: 'center', 
                          py: 3,
                          fontStyle: 'italic',
                          color: 'text.secondary'
                        }}>
                          📝 No additional students available for this competition
                          <br />
                          <small>All eligible students are already registered</small>
                        </MenuItem>
                      ];
                    }

                    // Render available students with grade headers
                    return availableStudents.reduce((acc, student, index, array) => {
                      // Add grade header when grade changes
                      if (index === 0 || array[index - 1].grade !== student.grade) {
                        acc.push(
                          <MenuItem key={`grade-${student.grade}`} disabled sx={{ 
                            bgcolor: 'primary.light', 
                            color: 'primary.contrastText',
                            fontWeight: 'bold'
                          }}>
                            📚 Grade {student.grade} ({array.filter(s => s.grade === student.grade).length} available)
                          </MenuItem>
                        );
                      }
                      
                      // Add the student item
                      acc.push(
                        <MenuItem key={student._id} value={student._id} sx={{ pl: 4 }}>
                          <Checkbox checked={additionalStudents.indexOf(student._id) > -1} />
                          <ListItemText 
                            primary={`${student.firstName} ${student.lastName}`}
                            secondary={`ID: ${student.studentId} | Class: ${student.class}`}
                            sx={{ ml: 1 }}
                          />
                        </MenuItem>
                      );
                      
                      return acc;
                    }, [] as React.ReactElement[]);
                  })()}
                </Select>
              </FormControl>

              {additionalStudents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Students to add ({additionalStudents.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {additionalStudents.map((studentId) => {
                      const student = students.find(s => s._id === studentId);
                      return student ? (
                        <Chip
                          key={studentId}
                          label={`${student.firstName} ${student.lastName} (${student.grade})`}
                          onDelete={() => {
                            setAdditionalStudents(prev => prev.filter(id => id !== studentId));
                          }}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              )}

              {selectedRegistrationForAdd.students.length + additionalStudents.length > selectedRegistrationForAdd.competition.maxStudentsPerTeacher && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Cannot add {additionalStudents.length} students. This would exceed the maximum of {selectedRegistrationForAdd.competition.maxStudentsPerTeacher} students per teacher.
                </Alert>
              )}

              {/* Cross-Competition Conflict Warnings */}
              {crossCompetitionWarnings.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Alert 
                    severity="warning" 
                    icon={<WarningIcon />}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      ⚠️ Cross-Competition Registration Detected
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {crossCompetitionWarnings.length} selected student{crossCompetitionWarnings.length !== 1 ? 's are' : ' is'} already registered in other competitions. Review details below:
                    </Typography>
                    
                    {/* Summary of competitions and teachers */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.lighter', borderRadius: 1, border: '1px solid', borderColor: 'warning.light' }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                        📋 Conflict Summary:
                      </Typography>
                      {crossCompetitionWarnings.map((warning, index) => (
                        <Box key={warning.studentId} sx={{ mb: 1.5 }}>
                          <Typography variant="body2" fontWeight="medium" color="text.primary">
                            👤 {warning.studentName} (ID: {warning.studentIdNumber})
                          </Typography>
                          {warning.registrations && warning.registrations.map((reg: any, regIndex: number) => (
                            <Box key={regIndex} sx={{ ml: 2, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                🏆 <strong>{reg.competitionName}</strong> ({reg.competitionCategory}) - Registered by <strong>{reg.teacherName}</strong> ({reg.teacherDepartment})
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  </Alert>

                  {crossCompetitionWarnings.map((warning, index) => (
                    <Accordion key={warning.studentId} sx={{ mb: 1 }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                          bgcolor: 'warning.light',
                          '&:hover': { bgcolor: 'warning.main' },
                          borderRadius: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Badge badgeContent={warning.competitionsCount} color="error">
                            <PersonIcon color="action" />
                          </Badge>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {warning.studentName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {warning.studentIdNumber} | Grade {warning.studentGrade} | Class {warning.studentClass}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="error">
                            {warning.competitionsCount} conflict{warning.competitionsCount !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          This student is already registered in the following competitions:
                        </Typography>
                        
                        {warning.registrations && warning.registrations.map((reg: any, regIndex: number) => (
                          <Paper key={regIndex} sx={{ p: 2, mb: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'warning.light' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <CompetitionIcon fontSize="small" color="primary" />
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                {reg.competitionName}
                              </Typography>
                              <Chip 
                                label={reg.competitionCategory} 
                                size="small" 
                                variant="outlined"
                                color="primary"
                              />
                            </Box>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>👨‍🏫 Teacher</Typography>
                                <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, mt: 0.5 }}>
                                  <Typography variant="body1" fontWeight="bold">
                                    {reg.teacherName}
                                  </Typography>
                                  {reg.teacherDepartment && (
                                    <Typography variant="caption" color="text.secondary">
                                      📚 {reg.teacherDepartment}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    📧 {reg.teacherEmail}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>📅 Competition Period</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  {new Date(reg.competitionStartDate).toLocaleDateString()} - {new Date(reg.competitionEndDate).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium', mt: 1 }}>📝 Registration Date</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  {new Date(reg.registrationDate).toLocaleDateString()}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                        
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Note:</strong> You can still proceed with registration. This is just to inform you about potential scheduling conflicts.
                          </Typography>
                        </Alert>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {loadingConflictCheck && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Checking for scheduling conflicts...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStudentsDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddStudentsToRegistration}
            variant="contained"
            disabled={
              addingStudents || 
              additionalStudents.length === 0 || 
              (selectedRegistrationForAdd?.students.length || 0) + additionalStudents.length > (selectedRegistrationForAdd?.competition.maxStudentsPerTeacher || 4)
            }
            startIcon={addingStudents ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {addingStudents ? 'Adding Students...' : `Add ${additionalStudents.length} Student${additionalStudents.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
