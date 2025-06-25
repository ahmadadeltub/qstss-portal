import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  School as SchoolIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

interface Teacher {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  subjects: string[];
  phoneNumber?: string;
  role: 'teacher' | 'admin';
  isActive: boolean;
  createdAt: string;
}

interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  grade: string;
  class: string;
  dateOfBirth?: string;
  parentContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  isActive: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  // Dialog states
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [resetPasswordTeacher, setResetPasswordTeacher] = useState<Teacher | null>(null);

  // Form states
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

  const [studentForm, setStudentForm] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    grade: '',
    class: '',
    dateOfBirth: '',
    parentContact: {
      name: '',
      phone: '',
      email: ''
    },
    isActive: true
  });

  const [newPassword, setNewPassword] = useState('');

  const departments = [
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
  const subjectsList = ['Algebra', 'Geometry', 'Biology', 'Chemistry', 'Physics', 'Literature', 'Writing', 'Grammar', 'History', 'Geography', 'Art', 'Music', 'PE'];
  const grades = ['9', '10', '11', '12']; // Qatar Science and Technology Secondary School grades
  const classes = ['A', 'B', 'C', 'D']; // 4 sections per grade

  // Notification helper function
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setNotificationOpen(true);
  };

  useEffect(() => {
    if (tabValue === 0) {
      fetchTeachers();
    } else if (tabValue === 1) {
      fetchStudents();
    }
  }, [tabValue]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/teachers');
      setTeachers(response.teachers || []);
    } catch (error) {
      showNotification('Failed to fetch teachers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStudents({ limit: 100 });
      setStudents(response.data || []);
    } catch (error) {
      showNotification('Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async () => {
    try {
      setLoading(true);
      await apiService.post('/teachers', teacherForm);
      showNotification('Teacher created successfully', 'success');
      setTeacherDialogOpen(false);
      resetTeacherForm();
      fetchTeachers();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to create teacher', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return;
    
    try {
      setLoading(true);
      await apiService.put(`/teachers/${editingTeacher._id}`, teacherForm);
      showNotification('Teacher updated successfully', 'success');
      setTeacherDialogOpen(false);
      setEditingTeacher(null);
      resetTeacherForm();
      fetchTeachers();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update teacher', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      setLoading(true);
      await apiService.delete(`/teachers/${teacherId}`);
      showNotification('Teacher deleted successfully', 'success');
      fetchTeachers();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to delete teacher', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordTeacher || !newPassword) return;
    
    try {
      setLoading(true);
      await apiService.put(`/teachers/${resetPasswordTeacher._id}/reset-password`, {
        newPassword
      });
      showNotification('Password reset successfully', 'success');
      setResetPasswordDialogOpen(false);
      setResetPasswordTeacher(null);
      setNewPassword('');
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    try {
      setLoading(true);
      await apiService.post('/students', studentForm);
      setSuccess('Student created successfully');
      setStudentDialogOpen(false);
      resetStudentForm();
      fetchStudents();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    
    try {
      setLoading(true);
      await apiService.put(`/students/${editingStudent._id}`, studentForm);
      setSuccess('Student updated successfully');
      setStudentDialogOpen(false);
      setEditingStudent(null);
      resetStudentForm();
      fetchStudents();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      setLoading(true);
      await apiService.delete(`/students/${studentId}`);
      setSuccess('Student deleted successfully');
      fetchStudents();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  // Generate next available student ID for Qatar school
  const generateNextStudentId = () => {
    const maxId = students.reduce((max, student) => {
      const numericId = parseInt(student.studentId.replace('QS', ''));
      return numericId > max ? numericId : max;
    }, 0);
    return `QS${String(maxId + 1).padStart(4, '0')}`;
  };

  // Auto-generate student ID for new students
  const handleOpenAddStudent = () => {
    resetStudentForm();
    setStudentForm(prev => ({
      ...prev,
      studentId: generateNextStudentId()
    }));
    setEditingStudent(null);
    setStudentDialogOpen(true);
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

  const resetStudentForm = () => {
    setStudentForm({
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      grade: '',
      class: '',
      dateOfBirth: '',
      parentContact: {
        name: '',
        phone: '',
        email: ''
      },
      isActive: true
    });
  };

  const openEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({
      email: teacher.email,
      password: '',
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      department: teacher.department,
      subjects: teacher.subjects,
      phoneNumber: teacher.phoneNumber || '',
      role: teacher.role,
      isActive: teacher.isActive
    });
    setTeacherDialogOpen(true);
  };

  const openEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || '',
      grade: student.grade,
      class: student.class,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      parentContact: {
        name: student.parentContact?.name || '',
        phone: student.parentContact?.phone || '',
        email: student.parentContact?.email || ''
      },
      isActive: student.isActive
    });
    setStudentDialogOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Admin Panel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<GroupIcon />} label="Manage Teachers" />
          <Tab icon={<SchoolIcon />} label="Manage Students" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Teachers Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetTeacherForm();
                setEditingTeacher(null);
                setTeacherDialogOpen(true);
              }}
            >
              Add Teacher
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher._id}>
                    <TableCell>{`${teacher.firstName} ${teacher.lastName}`}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.department}</TableCell>
                    <TableCell>
                      <Chip 
                        label={teacher.role} 
                        color={teacher.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={teacher.isActive ? 'Active' : 'Inactive'} 
                        color={teacher.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => openEditTeacher(teacher)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset Password">
                        <IconButton 
                          onClick={() => {
                            setResetPasswordTeacher(teacher);
                            setResetPasswordDialogOpen(true);
                          }}
                          size="small"
                        >
                          <LockIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => handleDeleteTeacher(teacher._id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Students Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddStudent}
            >
              Add Student
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={student.isActive ? 'Active' : 'Inactive'} 
                        color={student.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => openEditStudent(student)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => handleDeleteStudent(student._id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Teacher Dialog */}
      <Dialog open={teacherDialogOpen} onClose={() => setTeacherDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                disabled={!!editingTeacher}
              />
            </Grid>
            {!editingTeacher && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                value={teacherForm.firstName}
                onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                value={teacherForm.lastName}
                onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={teacherForm.department}
                  onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                >
                  {departments.map((dept) => (
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={teacherForm.role}
                  onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value as 'teacher' | 'admin' })}
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
          <Button onClick={() => setTeacherDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingTeacher ? handleUpdateTeacher : handleCreateTeacher}
            variant="contained"
            disabled={loading}
          >
            {editingTeacher ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Dialog */}
      <Dialog open={studentDialogOpen} onClose={() => setStudentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Student ID"
                fullWidth
                value={studentForm.studentId}
                onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                disabled={!!editingStudent}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                value={studentForm.firstName}
                onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                value={studentForm.lastName}
                onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={studentForm.grade}
                  onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                >
                  {grades.map((grade) => (
                    <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={studentForm.class}
                  onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                >
                  {grades.map(grade =>
                    classes.map(cls => (
                      <MenuItem key={`${grade}${cls}`} value={`${grade}${cls}`}>
                        {grade}{cls}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of Birth"
                type="date"
                fullWidth
                value={studentForm.dateOfBirth}
                onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={studentForm.isActive}
                    onChange={(e) => setStudentForm({ ...studentForm, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Parent Contact</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Parent Name"
                fullWidth
                value={studentForm.parentContact.name}
                onChange={(e) => setStudentForm({
                  ...studentForm,
                  parentContact: { ...studentForm.parentContact, name: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Parent Phone"
                fullWidth
                value={studentForm.parentContact.phone}
                onChange={(e) => setStudentForm({
                  ...studentForm,
                  parentContact: { ...studentForm.parentContact, phone: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Parent Email"
                fullWidth
                value={studentForm.parentContact.email}
                onChange={(e) => setStudentForm({
                  ...studentForm,
                  parentContact: { ...studentForm.parentContact, email: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingStudent ? handleUpdateStudent : handleCreateStudent}
            variant="contained"
            disabled={loading}
          >
            {editingStudent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Reset password for: {resetPasswordTeacher?.firstName} {resetPasswordTeacher?.lastName}
          </Typography>
          <TextField
            autoFocus
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Password must be at least 6 characters long"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={loading || newPassword.length < 6}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notificationOpen}
        autoHideDuration={6000}
        onClose={() => setNotificationOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotificationOpen(false)} 
          severity={notificationType}
          sx={{ width: '100%' }}
        >
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPanel;
