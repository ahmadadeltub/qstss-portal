import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Grid,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, CircularProgress, IconButton, Collapse, Tooltip
} from '@mui/material';
import { Delete, ExpandMore, ExpandLess, PersonRemove } from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { useNotifications } from '../contexts/NotificationContext';

interface Registration {
  _id: string;
  competition: {
    _id: string;
    name: string;
    description: string;
    category: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    venue?: string;
    status: string;
  };
  students: Array<{
    student: {
      _id: string;
      studentId: string;
      firstName: string;
      lastName: string;
      grade: string;
      class: string;
    };
    status: string;
  }>;
  registrationDate: string;
  status: string;
}

const MyRegistrations: React.FC = () => {
  const { addWithdrawalNotification, addStudentRemovalNotification } = useNotifications();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // New state for removing students
  const [removeStudentDialogOpen, setRemoveStudentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: string;
    studentName: string;
    registrationId: string;
    competitionName: string;
  } | null>(null);
  const [removingStudent, setRemovingStudent] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await apiService.getMyRegistrations();
      setRegistrations(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setAlert({ type: 'error', message: 'Failed to load registrations' });
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (registration: Registration) => {
    setSelectedRegistration(registration);
    setDeleteDialogOpen(true);
  };

  const handleRemoveStudentClick = (
    studentId: string, 
    studentName: string, 
    registrationId: string, 
    competitionName: string
  ) => {
    setSelectedStudent({
      studentId,
      studentName,
      registrationId,
      competitionName
    });
    setRemoveStudentDialogOpen(true);
  };

  const handleRemoveStudent = async () => {
    if (!selectedStudent) return;

    setRemovingStudent(true);
    try {
      await apiService.removeStudentFromRegistration(
        selectedStudent.registrationId, 
        selectedStudent.studentId
      );
      setAlert({ 
        type: 'success', 
        message: `${selectedStudent.studentName} has been removed from ${selectedStudent.competitionName}` 
      });
      setRemoveStudentDialogOpen(false);
      fetchRegistrations(); // Refresh the list
    } catch (error: any) {
      console.error('Error removing student:', error);
      
      // Provide detailed error messages similar to delete registration
      let errorMessage = 'Failed to remove student';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Cannot remove this student. The deadline may have passed or this is the last student in the registration.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You can only modify your own registrations.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Student or registration not found.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      }
      
      setAlert({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      setRemovingStudent(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRegistration) return;

    setDeleting(true);
    try {
      await apiService.deleteRegistration(selectedRegistration._id);
      setAlert({ 
        type: 'success', 
        message: `Registration for ${selectedRegistration.competition.name} has been cancelled` 
      });
      setDeleteDialogOpen(false);
      fetchRegistrations(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting registration:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'Failed to cancel registration';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Cannot cancel this registration. The deadline may have passed or the competition is no longer accepting cancellations.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You can only cancel your own registrations.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Registration not found. It may have already been cancelled.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      }
      
      setAlert({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpand = (registrationId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(registrationId)) {
      newExpanded.delete(registrationId);
    } else {
      newExpanded.add(registrationId);
    }
    setExpandedCards(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getCompetitionStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const canCancelRegistration = (registration: Registration) => {
    const deadline = new Date(registration.competition.registrationDeadline);
    const now = new Date();
    return deadline > now && 
           registration.status !== 'cancelled' && 
           registration.competition.status === 'upcoming';
  };

  const canRemoveStudent = (registration: Registration) => {
    const deadline = new Date(registration.competition.registrationDeadline);
    const now = new Date();
    return deadline > now && 
           registration.status !== 'cancelled' && 
           registration.competition.status === 'upcoming' &&
           registration.students.length > 1; // Don't allow removing the last student
  };

  const getStudentRemovalReason = (registration: Registration) => {
    const deadline = new Date(registration.competition.registrationDeadline);
    const now = new Date();
    
    if (registration.status === 'cancelled') {
      return 'Registration is cancelled';
    }
    if (registration.competition.status !== 'upcoming') {
      return `Competition is ${registration.competition.status}`;
    }
    if (deadline <= now) {
      return `Deadline passed (${deadline.toLocaleDateString()})`;
    }
    if (registration.students.length <= 1) {
      return 'Cannot remove last student - cancel registration instead';
    }
    return 'Can remove student';
  };

  const getCancellationReason = (registration: Registration) => {
    const deadline = new Date(registration.competition.registrationDeadline);
    const now = new Date();
    
    if (registration.status === 'cancelled') {
      return 'Registration already cancelled';
    }
    if (registration.competition.status !== 'upcoming') {
      return `Competition is ${registration.competition.status}`;
    }
    if (deadline <= now) {
      return `Deadline passed (${deadline.toLocaleDateString()})`;
    }
    return 'Can be cancelled';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Registrations
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your competition registrations. You can view details and cancel registrations before the deadline.
        </Typography>

        {registrations.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                No registrations found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                You haven't registered for any competitions yet.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {registrations.map((registration) => {
              const isExpanded = expandedCards.has(registration._id);
              return (
                <Grid item xs={12} key={registration._id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h2">
                            {registration.competition.name}
                          </Typography>
                          <Typography color="text.secondary" gutterBottom>
                            {registration.competition.category}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={registration.status} 
                            color={getStatusColor(registration.status)}
                            size="small"
                          />
                          <Chip 
                            label={registration.competition.status} 
                            color={getCompetitionStatusColor(registration.competition.status)}
                            size="small"
                          />
                          {canCancelRegistration(registration) ? (
                            <Tooltip title="Cancel this registration">
                              <IconButton 
                                color="error" 
                                onClick={() => handleDeleteClick(registration)}
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title={getCancellationReason(registration)}>
                              <span>
                                <IconButton 
                                  color="error" 
                                  size="small"
                                  disabled
                                >
                                  <Delete />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Registered Students:</strong> {registration.students.length}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Registration Date:</strong>{' '}
                            {new Date(registration.registrationDate).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Competition Date:</strong>{' '}
                            {new Date(registration.competition.startDate).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        {registration.competition.venue && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Venue:</strong> {registration.competition.venue}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                          onClick={() => toggleExpand(registration._id)}
                          endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                          size="small"
                        >
                          {isExpanded ? 'Hide' : 'Show'} Student Details
                        </Button>
                      </Box>

                      <Collapse in={isExpanded}>
                        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Registered Students:
                          </Typography>
                          <Grid container spacing={2}>
                            {registration.students.map((studentReg, index) => (
                              <Grid item xs={12} sm={6} md={4} key={studentReg.student._id}>
                                <Card variant="outlined" sx={{ p: 2, position: 'relative' }}>
                                  {canRemoveStudent(registration) ? (
                                    <Tooltip title="Remove student from registration">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveStudentClick(
                                          studentReg.student._id,
                                          `${studentReg.student.firstName} ${studentReg.student.lastName}`,
                                          registration._id,
                                          registration.competition.name
                                        )}
                                        sx={{ 
                                          position: 'absolute', 
                                          top: 8, 
                                          right: 8,
                                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                          '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                          }
                                        }}
                                      >
                                        <PersonRemove fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title={getStudentRemovalReason(registration)}>
                                      <span>
                                        <IconButton
                                          size="small"
                                          disabled
                                          sx={{ 
                                            position: 'absolute', 
                                            top: 8, 
                                            right: 8,
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                          }}
                                        >
                                          <PersonRemove fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  )}
                                  <Typography variant="body2" fontWeight="bold" sx={{ pr: 4 }}>
                                    {studentReg.student.firstName} {studentReg.student.lastName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ID: {studentReg.student.studentId}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Class: {studentReg.student.class}
                                  </Typography>
                                  <Chip 
                                    label={studentReg.status} 
                                    size="small" 
                                    sx={{ mt: 1 }}
                                    color={getStatusColor(studentReg.status)}
                                  />
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Cancel Registration</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel your registration for{' '}
              <strong>{selectedRegistration?.competition.name}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This will remove all {selectedRegistration?.students.length} registered students from this competition.
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Keep Registration</Button>
            <Button 
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={deleting}
            >
              {deleting ? <CircularProgress size={20} /> : 'Cancel Registration'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Remove Student Confirmation Dialog */}
        <Dialog open={removeStudentDialogOpen} onClose={() => setRemoveStudentDialogOpen(false)}>
          <DialogTitle>Remove Student</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove{' '}
              <strong>{selectedStudent?.studentName}</strong>{' '}
              from <strong>{selectedStudent?.competitionName}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This will remove the student from this competition registration.
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRemoveStudentDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRemoveStudent}
              color="error"
              variant="contained"
              disabled={removingStudent}
            >
              {removingStudent ? <CircularProgress size={20} /> : 'Remove Student'}
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
      </Box>
    </Container>
  );
};

export default MyRegistrations;
