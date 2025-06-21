import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Checkbox,
  Snackbar,
  Alert,
  Paper,
  Fab,
  CircularProgress,
  Divider,
  Tooltip,
  OutlinedInput,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  DateRange as DateRangeIcon,
  Flag as CountryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { useNotifications } from '../contexts/NotificationContext';

interface Competition {
  _id: string;
  name: string;
  description: string;
  category: string;
  maxParticipants: number;
  maxStudentsPerTeacher: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  eligibleGrades: string[];
  venue?: string;
  rules?: string;
  prizes: Array<{
    position: string;
    description: string;
    value: string;
  }>;
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  organizerName: string;
  country: string;
  participantCount: number;
  status: string;
  registeredCount?: number;
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

interface RegisteredStudent {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  grade: string;
  class: string;
  status: string;
}

interface RegistrationGroup {
  registrationId: string;
  teacher: {
    _id: string;
    name: string;
    department: string;
  };
  students: RegisteredStudent[];
  registrationDate: string;
  status: string;
  comments?: string;
}

interface CompetitionRegistrations {
  totalStudents: number;
  registrations: RegistrationGroup[];
}

interface CompetitionForm {
  name: string;
  description: string;
  category: string;
  maxParticipants: string;
  maxStudentsPerTeacher: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  eligibleGrades: string[];
  venue: string;
  rules: string;
  organizerName: string;
  country: string;
  participantCount: string;
}

const categories = [
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
];

const grades = ['9', '10', '11-Engineering', '11-IT', '11-Medical', '12-Engineering', '12-IT', '12-Medical'];

const Competitions: React.FC = () => {
  const { user } = useAuth();
  const { addRegistrationNotification } = useNotifications();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>(grades);
  const [loading, setLoading] = useState(true);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Competition management states
  const [competitionDialogOpen, setCompetitionDialogOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [competitionForm, setCompetitionForm] = useState<CompetitionForm>({
    name: '',
    description: '',
    category: '',
    maxParticipants: '',
    maxStudentsPerTeacher: '4',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    eligibleGrades: [],
    venue: '',
    rules: '',
    organizerName: '',
    country: 'Qatar',
    participantCount: '0'
  });

  // Registered students display states
  const [registeredStudentsDialogOpen, setRegisteredStudentsDialogOpen] = useState(false);
  const [selectedCompetitionForStudents, setSelectedCompetitionForStudents] = useState<Competition | null>(null);
  const [competitionRegistrations, setCompetitionRegistrations] = useState<CompetitionRegistrations | null>(null);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [expandedRegistrations, setExpandedRegistrations] = useState<string[]>([]);

  // Warning dialog states
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [crossCompetitionWarnings, setCrossCompetitionWarnings] = useState<Array<{
    studentId: string;
    studentName: string;
    studentIdNumber: string;
    competitions: string[];
    message: string;
  }>>([]);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<{
    competitionId: string;
    studentIds: string[];
  } | null>(null);

  useEffect(() => {
    console.log('=== Competitions Component Mount ===');
    console.log('User:', user);
    console.log('User authenticated:', !!user);
    
    if (user) {
      console.log('User is authenticated, fetching data...');
      fetchCompetitions();
      fetchStudents();
      fetchGrades();
    } else {
      console.log('User not authenticated, skipping fetch');
    }
  }, [user]);

  const fetchGrades = async () => {
    try {
      console.log('=== Fetching Grades ===');
      const response = await apiService.getStudentClasses();
      console.log('Grades response:', response);
      
      if (response.grades && Array.isArray(response.grades)) {
        setAvailableGrades(response.grades);
        console.log('✅ Grades set successfully:', response.grades);
      } else {
        console.log('❌ No grades in response, using default');
        setAvailableGrades(grades);
      }
    } catch (error) {
      console.error('=== Grades Fetch Error ===');
      console.error('Error:', error);
      setAvailableGrades(grades); // Fallback to default grades
    }
  };

  const fetchCompetitions = async () => {
    try {
      console.log('=== Fetching Competitions ===');
      console.log('API URL:', process.env.REACT_APP_API_URL);
      console.log('Token exists:', !!localStorage.getItem('token'));
      
      setLoading(true);
      const response = await apiService.getCompetitions();
      console.log('=== Competitions Response ===');
      console.log('Response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      console.log('Length:', Array.isArray(response) ? response.length : 'N/A');
      
      if (Array.isArray(response)) {
        setCompetitions(response);
        console.log('✅ Competitions set successfully:', response.length, 'items');
      } else {
        console.log('❌ Response is not an array:', response);
        setCompetitions([]);
      }
    } catch (error) {
      console.error('=== Competition Fetch Error ===');
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      setAlert({ type: 'error', message: 'Failed to load competitions' });
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('=== Fetching Students ===');
      // Request ALL students for competition registration (no pagination limit)
      const response = await apiService.getStudents({ limit: 1000 }); // Request up to 1000 students
      console.log('Students response:', response);
      console.log('Students type:', typeof response, 'Is array:', Array.isArray(response));
      
      if (Array.isArray(response)) {
        setStudents(response);
        console.log('✅ Students set successfully:', response.length, 'items');
      } else {
        console.log('❌ Students response is not an array:', response);
        setStudents([]);
      }
    } catch (error) {
      console.error('=== Students Fetch Error ===');
      console.error('Error:', error);
      setAlert({ type: 'error', message: 'Failed to load students' });
      setStudents([]);
    }
  };

  const handleRegisterClick = (competition: Competition) => {
    setSelectedCompetition(competition);
    // Show ALL students, not just eligible grades
    const allStudents = students;
    
    // Enhanced sorting: Grade → Class → Last Name → First Name
    const sortedStudents = allStudents.sort((a, b) => {
      // First sort by grade
      const gradeOrder = ['9', '10', '11-Engineering', '11-IT', '11-Medical', '12-Engineering', '12-IT', '12-Medical'];
      const gradeA = gradeOrder.indexOf(a.grade);
      const gradeB = gradeOrder.indexOf(b.grade);
      
      if (gradeA !== gradeB) {
        return gradeA - gradeB;
      }
      
      // If same grade, sort by class (A, B, C, etc.)
      const classCompare = a.class.localeCompare(b.class, undefined, { 
        numeric: true, 
        sensitivity: 'base' 
      });
      if (classCompare !== 0) {
        return classCompare;
      }
      
      // If same grade and class, sort by last name
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) {
        return lastNameCompare;
      }
      
      // If same last name, sort by first name
      return a.firstName.localeCompare(b.firstName);
    });
    
    setFilteredStudents(sortedStudents);
    setSelectedStudents([]);
    setDialogOpen(true);
  };

  const handleStudentSelection = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedStudents(typeof value === 'string' ? value.split(',') : value);
  };

  const handleRegister = async () => {
    if (!selectedCompetition || selectedStudents.length === 0) return;

    setRegistering(true);
    try {
      // First check for cross-competition conflicts
      const warningCheck = await apiService.checkCrossCompetitionConflicts(
        selectedCompetition._id,
        selectedStudents
      );

      if (warningCheck.hasWarnings) {
        // Show warning dialog
        setCrossCompetitionWarnings(warningCheck.warnings);
        setPendingRegistrationData({
          competitionId: selectedCompetition._id,
          studentIds: selectedStudents
        });
        setWarningDialogOpen(true);
        setRegistering(false);
        return;
      }

      // No warnings, proceed with registration
      await performRegistration(selectedCompetition._id, selectedStudents);
    } catch (error: any) {
      console.error('Error checking for conflicts:', error);
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to check for conflicts' 
      });
      setRegistering(false);
    }
  };

  const performRegistration = async (competitionId: string, studentIds: string[]) => {
    setRegistering(true);
    try {
      const result = await apiService.post('/registrations', {
        competitionId,
        studentIds
      });

      let message = `Successfully registered ${studentIds.length} student(s) for ${selectedCompetition?.name}`;
      
      // If there are warnings in the response, show them
      if (result.warnings && result.warnings.length > 0) {
        message += '\n\nWarnings:\n' + result.warnings.join('\n');
      }

      setAlert({ 
        type: 'success', 
        message 
      });
      setDialogOpen(false);
      setWarningDialogOpen(false);
      setPendingRegistrationData(null);
      setCrossCompetitionWarnings([]);
      fetchCompetitions();
    } catch (error: any) {
      console.error('Error registering:', error);
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to register students' 
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleProceedWithWarnings = async () => {
    if (pendingRegistrationData) {
      await performRegistration(
        pendingRegistrationData.competitionId,
        pendingRegistrationData.studentIds
      );
    }
  };

  const handleCancelWithWarnings = () => {
    setWarningDialogOpen(false);
    setPendingRegistrationData(null);
    setCrossCompetitionWarnings([]);
    setRegistering(false);
  };

  const handleViewRegisteredStudents = async (competition: Competition) => {
    setSelectedCompetitionForStudents(competition);
    setLoadingRegistrations(true);
    setRegisteredStudentsDialogOpen(true);
    setExpandedRegistrations([]);
    
    try {
      const registrations = await apiService.getRegistrationsByCompetition(competition._id);
      setCompetitionRegistrations(registrations);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Failed to load registered students'
      });
      setCompetitionRegistrations({ totalStudents: 0, registrations: [] });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const toggleRegistrationExpanded = (registrationId: string) => {
    setExpandedRegistrations(prev => 
      prev.includes(registrationId) 
        ? prev.filter(id => id !== registrationId)
        : [...prev, registrationId]
    );
  };

  const handleCreateCompetition = () => {
    setEditingCompetition(null);
    setCompetitionForm({
      name: '',
      description: '',
      category: '',
      maxParticipants: '',
      maxStudentsPerTeacher: '4',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      eligibleGrades: [],
      venue: '',
      rules: '',
      organizerName: '',
      country: 'Qatar',
      participantCount: '0'
    });
    setCompetitionDialogOpen(true);
  };

  const handleEditCompetition = (competition: Competition) => {
    setEditingCompetition(competition);
    setCompetitionForm({
      name: competition.name,
      description: competition.description,
      category: competition.category,
      maxParticipants: competition.maxParticipants.toString(),
      maxStudentsPerTeacher: competition.maxStudentsPerTeacher.toString(),
      startDate: competition.startDate.split('T')[0],
      endDate: competition.endDate.split('T')[0],
      registrationDeadline: competition.registrationDeadline.split('T')[0],
      eligibleGrades: competition.eligibleGrades,
      venue: competition.venue || '',
      rules: competition.rules || '',
      organizerName: competition.organizerName,
      country: competition.country,
      participantCount: competition.participantCount.toString()
    });
    setCompetitionDialogOpen(true);
  };

  const handleSaveCompetition = async () => {
    try {
      const data = {
        ...competitionForm,
        maxParticipants: parseInt(competitionForm.maxParticipants),
        maxStudentsPerTeacher: parseInt(competitionForm.maxStudentsPerTeacher),
        participantCount: parseInt(competitionForm.participantCount)
      };

      if (editingCompetition) {
        await apiService.updateCompetition(editingCompetition._id, data);
        setAlert({ type: 'success', message: 'Competition updated successfully' });
      } else {
        await apiService.createCompetition(data);
        setAlert({ type: 'success', message: 'Competition created successfully' });
      }

      setCompetitionDialogOpen(false);
      fetchCompetitions();
    } catch (error: any) {
      console.error('Error saving competition:', error);
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to save competition' 
      });
    }
  };

  const handleDeleteCompetition = async (competitionId: string) => {
    if (!window.confirm('Are you sure you want to delete this competition?')) return;

    try {
      await apiService.deleteCompetition(competitionId);
      setAlert({ type: 'success', message: 'Competition deleted successfully' });
      fetchCompetitions();
    } catch (error: any) {
      console.error('Error deleting competition:', error);
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to delete competition' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const isRegistrationOpen = (competition: Competition) => {
    const deadline = new Date(competition.registrationDeadline);
    const now = new Date();
    return deadline > now && competition.status === 'upcoming';
  };

  const canEditCompetition = (competition: Competition) => {
    return user?.role === 'admin' || (competition.organizer && competition.organizer._id === user?.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading competitions...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we fetch the latest competition data
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show empty state with helpful message
  if (!loading && competitions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Qatar Science & Technology Secondary School
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9 }}>
            Academic Competitions Portal
          </Typography>
        </Paper>

        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom color="text.secondary">
            No competitions available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {user ? 
              'There are currently no competitions to display. Check back later or contact an administrator.' :
              'Please ensure you are logged in to view competitions.'
            }
          </Typography>
          
          {process.env.NODE_ENV === 'development' && (
            <Card sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5', border: '2px dashed #ccc', maxWidth: 600, mx: 'auto' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                🔧 Debug Information
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'left' }}>
                <strong>User:</strong> {user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Not authenticated'}<br/>
                <strong>Competitions Array Length:</strong> {competitions.length}<br/>
                <strong>API URL:</strong> {process.env.REACT_APP_API_URL}<br/>
                <strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}<br/>
                <strong>Loading State:</strong> {loading ? 'True' : 'False'}
              </Typography>
              <Button 
                variant="contained" 
                onClick={fetchCompetitions} 
                sx={{ mt: 2 }}
                disabled={!user}
              >
                Retry Fetch Competitions
              </Button>
            </Card>
          )}
          
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleCreateCompetition}
              sx={{ mt: 3 }}
            >
              Create First Competition
            </Button>
          )}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Qatar Science & Technology Secondary School
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9 }}>
          Academic Competitions Portal
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>
          Explore and participate in prestigious academic competitions designed to challenge and inspire our students
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2">
          Available Competitions
        </Typography>
        
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <Fab 
            color="primary" 
            aria-label="add competition"
            onClick={handleCreateCompetition}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>

      <Grid container spacing={3}>
        {competitions.map((competition) => (
          <Grid item xs={12} md={6} lg={4} key={competition._id}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
                    {competition.name}
                  </Typography>
                  <Box>
                    <Chip 
                      label={competition.status} 
                      color={getStatusColor(competition.status) as any}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {canEditCompetition(competition) && (
                      <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditCompetition(competition)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {user?.role === 'admin' && (
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteCompetition(competition._id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>

                <Typography color="text.secondary" gutterBottom>
                  {competition.category}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2, minHeight: '60px' }}>
                  {competition.description}
                </Typography>

                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DateRangeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CountryIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {competition.country}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {competition.organizerName}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {competition.participantCount} / {competition.maxParticipants} participants
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Eligible Grades:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {competition.eligibleGrades.map((grade) => (
                      <Chip key={grade} label={`Grade ${grade}`} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Max Students per Teacher:</strong> {competition.maxStudentsPerTeacher}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Registration Deadline:</strong> {formatDate(competition.registrationDeadline)}
                  </Typography>
                </Box>

                {competition.venue && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {competition.venue}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Chip
                    label={isRegistrationOpen(competition) ? 'Registration Open' : 'Registration Closed'}
                    color={isRegistrationOpen(competition) ? 'success' : 'error'}
                    variant="filled"
                  />
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  onClick={() => handleRegisterClick(competition)}
                  disabled={!isRegistrationOpen(competition)}
                  sx={{ flexGrow: 1, mr: 1 }}
                >
                  {isRegistrationOpen(competition) ? 'Register Students' : 'Closed'}
                </Button>
                <Tooltip title="View registered students">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewRegisteredStudents(competition)}
                    startIcon={<GroupIcon />}
                    sx={{ minWidth: 'auto' }}
                  >
                    View
                  </Button>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Student Registration Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Register Students for {selectedCompetition?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select up to {selectedCompetition?.maxStudentsPerTeacher} students from any grade level.
              <br />
              <strong>Note:</strong> Competition eligible grades are {selectedCompetition?.eligibleGrades.join(', ')}, but you can register students from any grade.
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Select Students</InputLabel>
              <Select
                multiple
                value={selectedStudents}
                onChange={handleStudentSelection}
                input={<OutlinedInput label="Select Students" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const student = filteredStudents.find(s => s._id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={student ? `${student.firstName} ${student.lastName} (${student.grade}-${student.class})` : value}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {filteredStudents.reduce((acc, student, index) => {
                  const prevStudent = index > 0 ? filteredStudents[index - 1] : null;
                  const isFirstInGrade = !prevStudent || prevStudent.grade !== student.grade;
                  const isFirstInClass = !prevStudent || prevStudent.grade !== student.grade || prevStudent.class !== student.class;
                  
                  const gradeDisplayName = student.grade.includes('-') 
                    ? student.grade.replace('-', ' - ')
                    : `Grade ${student.grade}`;
                  
                  // Add grade header if this is the first student in this grade
                  if (isFirstInGrade) {
                    acc.push(
                      <MenuItem key={`grade-header-${student.grade}`} disabled sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        py: 1
                      }}>
                        📚 {gradeDisplayName}
                      </MenuItem>
                    );
                  }
                  
                  // Add class header if this is the first student in this class within the grade
                  if (isFirstInClass && (!isFirstInGrade || student.class !== 'A')) {
                    acc.push(
                      <MenuItem key={`class-header-${student.grade}-${student.class}`} disabled sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'primary.contrastText',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        pl: 2,
                        py: 0.5
                      }}>
                        🏫 Class {student.class}
                      </MenuItem>
                    );
                  }
                  
                  // Add the student item
                  acc.push(
                    <MenuItem key={student._id} value={student._id} sx={{ pl: 4 }}>
                      <Checkbox checked={selectedStudents.indexOf(student._id) > -1} />
                      <ListItemText 
                        primary={`${student.firstName} ${student.lastName}`}
                        secondary={`ID: ${student.studentId}`}
                        sx={{ ml: 1 }}
                      />
                    </MenuItem>
                  );
                  
                  return acc;
                }, [] as React.ReactElement[])}
              </Select>
            </FormControl>

            {selectedStudents.length > (selectedCompetition?.maxStudentsPerTeacher || 4) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You can only register up to {selectedCompetition?.maxStudentsPerTeacher} students per competition.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRegister}
            variant="contained"
            disabled={
              registering || 
              selectedStudents.length === 0 || 
              selectedStudents.length > (selectedCompetition?.maxStudentsPerTeacher || 4)
            }
          >
            {registering ? <CircularProgress size={20} /> : 'Register Students'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cross-Competition Warning Dialog */}
      <Dialog 
        open={warningDialogOpen} 
        onClose={handleCancelWithWarnings} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          ⚠️ Student Already Registered Warning
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              The following students are already registered in other competitions:
            </Typography>
            
            {crossCompetitionWarnings.map((warning, index) => (
              <Paper 
                key={warning.studentId} 
                elevation={2} 
                sx={{ p: 2, mb: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  👤 {warning.studentName} (ID: {warning.studentIdNumber})
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Already registered in: <strong>{warning.competitions.join(', ')}</strong>
                </Typography>
              </Paper>
            ))}
            
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              <strong>Note:</strong> You can still proceed with the registration. This is just a notification 
              that these students are participating in multiple competitions.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelWithWarnings} color="inherit">
            Cancel Registration
          </Button>
          <Button 
            onClick={handleProceedWithWarnings} 
            variant="contained" 
            color="warning"
            disabled={registering}
          >
            {registering ? <CircularProgress size={20} /> : 'Proceed Anyway'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Competition Create/Edit Dialog */}
      <Dialog open={competitionDialogOpen} onClose={() => setCompetitionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCompetition ? 'Edit Competition' : 'Create New Competition'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Competition Name"
              value={competitionForm.name}
              onChange={(e) => setCompetitionForm({ ...competitionForm, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={competitionForm.description}
              onChange={(e) => setCompetitionForm({ ...competitionForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={competitionForm.category}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, category: e.target.value })}
                    label="Category"
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Organizer Name"
                  value={competitionForm.organizerName}
                  onChange={(e) => setCompetitionForm({ ...competitionForm, organizerName: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Country"
                  value={competitionForm.country}
                  onChange={(e) => setCompetitionForm({ ...competitionForm, country: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Venue"
                  value={competitionForm.venue}
                  onChange={(e) => setCompetitionForm({ ...competitionForm, venue: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Participants"
                  type="number"
                  value={competitionForm.maxParticipants}
                  onChange={(e) => setCompetitionForm({ ...competitionForm, maxParticipants: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Students per Teacher"
                  type="number"
                  value={competitionForm.maxStudentsPerTeacher}
                  onChange={(e) => setCompetitionForm({ ...competitionForm, maxStudentsPerTeacher: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <TextField
              label="Current Participant Count"
              type="number"
              value={competitionForm.participantCount}
              onChange={(e) => setCompetitionForm({ ...competitionForm, participantCount: e.target.value })}
              fullWidth
              helperText="Number of students currently participating"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={competitionForm.startDate}
                  onChange={(e) => setCompetitionForm({ ...competitionForm, startDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="End Date"
                  type="date"
                  value={competitionForm.endDate}
                  onChange={(e) => setCompetitionForm({ ...competitionForm, endDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Registration Deadline"
                  type="date"
                  value={competitionForm.registrationDeadline}
                  onChange={(e) => setCompetitionForm({ ...competitionForm, registrationDeadline: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>

            <FormControl fullWidth required>
              <InputLabel>Eligible Grades</InputLabel>
              <Select
                multiple
                value={competitionForm.eligibleGrades}
                onChange={(e) => setCompetitionForm({ 
                  ...competitionForm, 
                  eligibleGrades: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value 
                })}
                input={<OutlinedInput label="Eligible Grades" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={`Grade ${value}`} size="small" />
                    ))}
                  </Box>
                )}
              >
                {availableGrades.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    <Checkbox checked={competitionForm.eligibleGrades.indexOf(grade) > -1} />
                    <ListItemText primary={`Grade ${grade}`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Rules"
              value={competitionForm.rules}
              onChange={(e) => setCompetitionForm({ ...competitionForm, rules: e.target.value })}
              fullWidth
              multiline
              rows={4}
              helperText="Competition rules and guidelines"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompetitionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveCompetition}
            variant="contained"
            disabled={!competitionForm.name || !competitionForm.description || !competitionForm.category}
          >
            {editingCompetition ? 'Update Competition' : 'Create Competition'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Registered Students Dialog */}
      <Dialog open={registeredStudentsDialogOpen} onClose={() => setRegisteredStudentsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupIcon color="primary" />
            <Box>
              <Typography variant="h6">
                Registered Students for {selectedCompetitionForStudents?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {competitionRegistrations?.totalStudents || 0} student(s) registered across {competitionRegistrations?.registrations.length || 0} teacher(s)
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {loadingRegistrations ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress size={50} sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Loading registered students...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Please wait while we fetch the registration data
                </Typography>
              </Box>
            ) : competitionRegistrations?.registrations.length === 0 ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="200px">
                <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Students Registered
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  No students have registered for this competition yet.
                  <br />
                  Teachers can register students from the competition page.
                </Typography>
              </Box>
            ) : (
              <Box>
                {competitionRegistrations?.registrations.map((registration, index) => (
                  <Card key={registration.registrationId} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon color="action" />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              {registration.teacher.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {registration.teacher.department}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={`${registration.students.length} student${registration.students.length !== 1 ? 's' : ''}`}
                            size="small"
                            color="info"
                          />
                          <Chip 
                            label={registration.status} 
                            color={registration.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Grid container spacing={2}>
                        {registration.students.map((student, studentIndex) => (
                          <Grid item xs={12} sm={6} md={4} key={student._id}>
                            <Paper 
                              sx={{ 
                                p: 2, 
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'primary.light',
                                borderRadius: 2,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: 3
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <PersonIcon fontSize="small" color="primary" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                  {student.firstName} {student.lastName}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Grade:</strong> {student.grade}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Class:</strong> {student.class}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>ID:</strong> {student.studentId}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Chip 
                                  label={student.status || 'Active'} 
                                  size="small" 
                                  color={student.status === 'active' ? 'success' : 'default'}
                                  variant="outlined"
                                />
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => toggleRegistrationExpanded(registration.registrationId)}
                          startIcon={expandedRegistrations.includes(registration.registrationId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ 
                            color: expandedRegistrations.includes(registration.registrationId) ? 'error.main' : 'primary.main',
                            borderColor: expandedRegistrations.includes(registration.registrationId) ? 'error.main' : 'primary.main'
                          }}
                        >
                          {expandedRegistrations.includes(registration.registrationId) ? 'Hide Details' : 'Show Details'}
                        </Button>
                      </Box>

                      {expandedRegistrations.includes(registration.registrationId) && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Registration ID:</strong> {registration.registrationId}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Registration Date:</strong> {formatDate(registration.registrationDate)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Teacher's Comments:</strong> {registration.comments || 'No comments provided'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {competitionRegistrations?.totalStudents ? 
              `Total: ${competitionRegistrations.totalStudents} students registered` : 
              ''
            }
          </Typography>
          <Button onClick={() => setRegisteredStudentsDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar 
        open={!!alert} 
        autoHideDuration={6000} 
        onClose={() => setAlert(null)}
      >
        <Alert 
          onClose={() => setAlert(null)} 
          severity={alert?.type} 
          sx={{ width: '100%' }}
        >
          {alert?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Competitions;
