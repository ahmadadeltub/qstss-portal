import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  Pagination,
  Alert,
  CircularProgress,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Fab,
  Tooltip,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  grade: string;
  class: string;
  email?: string;
  skills?: string[];
  dateOfBirth?: string;
  parentContact?: {
    fatherName?: string;
    motherName?: string;
    phoneNumber?: string;
    email?: string;
  };
  academicInfo?: {
    // gpa removed as requested
  };
  isActive?: boolean;
}

const Students: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    grade: '',
    class: '',
    email: '',
    parentContact: {
      fatherName: '',
      motherName: '',
      phoneNumber: '',
      email: ''
    }
  });
  const [addingStudent, setAddingStudent] = useState(false);

  // Initialize from URL parameters
  useEffect(() => {
    const gradeFromUrl = searchParams.get('grade');
    const classFromUrl = searchParams.get('class');
    const searchFromUrl = searchParams.get('search');
    
    if (gradeFromUrl) {
      console.log('🔗 Grade from URL:', gradeFromUrl);
      setSelectedGrade(gradeFromUrl);
    }
    if (classFromUrl) {
      console.log('🔗 Class from URL:', classFromUrl);
      setSelectedClass(classFromUrl);
    }
    if (searchFromUrl) {
      console.log('🔗 Search from URL:', searchFromUrl);
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams]);

  const handleAddStudent = async () => {
    try {
      setAddingStudent(true);
      setError('');
      
      // Generate student ID
      const studentId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const studentData = {
        ...newStudent,
        studentId,
        email: newStudent.email || `${newStudent.firstName.toLowerCase()}.${newStudent.lastName.toLowerCase()}@qstss.edu.qa`,
        isActive: true
      };
      
      await apiService.post('/students', studentData);
      
      // Reset form
      setNewStudent({
        firstName: '',
        lastName: '',
        grade: '',
        class: '',
        email: '',
        parentContact: {
          fatherName: '',
          motherName: '',
          phoneNumber: '',
          email: ''
        }
      });
      
      setAddDialogOpen(false);
      await fetchStudents(); // Refresh the list
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add student');
    } finally {
      setAddingStudent(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Available grades state changed:', availableGrades);
  }, [availableGrades]);

  useEffect(() => {
    console.log('🎯 Selected grade state changed:', selectedGrade);
  }, [selectedGrade]);

  useEffect(() => {
    fetchStudentClasses();
  }, []);

  useEffect(() => {
    // Reset to page 1 when search filters change
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [searchTerm, selectedGrade, selectedClass]);

  useEffect(() => {
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedGrade, selectedClass, pagination.current]);

  // Filter classes based on selected grade
  useEffect(() => {
    if (selectedGrade && availableClasses.length > 0) {
      // Get all students from the current list to determine classes for selected grade
      const classesForGrade = availableClasses.filter(className => {
        // Map grade to class patterns
        if (selectedGrade === '9') return className.startsWith('09/');
        if (selectedGrade === '10') return className.startsWith('10/');
        if (selectedGrade === '11-Engineering') return className.startsWith('11/1') || className.startsWith('11/2');
        if (selectedGrade === '11-IT') return className.startsWith('11/3');
        if (selectedGrade === '11-Medical') return className.startsWith('11/4');
        if (selectedGrade === '12-Engineering') return className.startsWith('12/1') || className.startsWith('12/2');
        if (selectedGrade === '12-IT') return className.startsWith('12/3');
        if (selectedGrade === '12-Medical') return className.startsWith('12/4') || className.startsWith('12/5');
        return false;
      });
      setFilteredClasses(classesForGrade);
      
      // Reset class selection if current class doesn't belong to selected grade
      if (selectedClass && !classesForGrade.includes(selectedClass)) {
        setSelectedClass('');
      }
    } else {
      setFilteredClasses(availableClasses);
    }
  }, [selectedGrade, availableClasses, selectedClass]);

  const fetchStudentClasses = async () => {
    try {
      console.log('🔄 Fetching student classes and grades...');
      const response = await apiService.getStudentClasses();
      console.log('📡 API Response:', response);
      
      const rawGrades = Array.isArray(response.grades) ? response.grades : [];
      const rawClasses = Array.isArray(response.classes) ? response.classes : [];
      
      console.log('📊 Raw grades from API:', rawGrades);
      console.log('📊 Raw classes from API:', rawClasses);
      
      // Organize grades in logical order - ensure we include all specialized grades
      const orderedGrades = [
        '9', '10', 
        '11-Engineering', '11-IT', '11-Medical',
        '12-Engineering', '12-IT', '12-Medical'
      ].filter(grade => rawGrades.includes(grade));
      
      // Add any additional grades that might exist but weren't in our expected list
      const additionalGrades = rawGrades.filter((grade: string) => !orderedGrades.includes(grade));
      const finalGrades = [...orderedGrades, ...additionalGrades];
      
      console.log('📊 Final ordered grades:', finalGrades);
      console.log('✅ Setting available grades:', finalGrades);
      
      setGrades(rawGrades);
      setClasses(rawClasses);
      setAvailableGrades(finalGrades);
      setAvailableClasses(rawClasses);
      setFilteredClasses(rawClasses);
      
      console.log('✅ Student classes and grades loaded successfully');
      console.log('🔍 Available grades state updated to:', finalGrades);
    } catch (err) {
      console.error('❌ Failed to fetch classes:', err);
      setError('Failed to load grade filters. Please refresh the page.');
      setGrades([]);
      setClasses([]);
      setAvailableGrades([]);
      setAvailableClasses([]);
      setFilteredClasses([]);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.current,
        limit: 20,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (selectedGrade) params.grade = selectedGrade;
      if (selectedClass) params.class = selectedClass;

      console.log('📡 Fetching students with params:', params);
      const response = await apiService.getStudentsWithPagination(params);
      console.log('📊 API response:', response);
      
      // Handle response structure properly - API returns {data: [...], pagination: {...}}
      setStudents(Array.isArray(response.data) ? response.data : []);
      
      // Map backend pagination format to frontend format
      if (response.pagination) {
        setPagination({
          current: response.pagination.current || response.pagination.page || 1,
          pages: response.pagination.pages || 1,
          total: response.pagination.total || 0
        });
      } else {
        setPagination({ current: 1, pages: 1, total: 0 });
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Failed to fetch students');
      setStudents([]); // Ensure students is always an array
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    console.log('🔄 Page changed to:', value);
    setPagination(prev => ({ ...prev, current: value }));
  };

  const StudentCard: React.FC<{ student: Student }> = ({ student }) => (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {student.firstName} {student.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {student.studentId}
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip 
            label={
              student.grade.includes('-') 
                ? `${student.grade.replace('-', ' - ')}`
                : `Grade ${student.grade}`
            } 
            size="small" 
            color="primary"
            icon={<SchoolIcon />}
            sx={{ 
              fontWeight: 'bold',
              '& .MuiChip-icon': { fontSize: 16 }
            }}
          />
          <Chip 
            label={`Class ${student.class}`} 
            size="small" 
            color="secondary"
            variant="outlined"
          />
        </Box>

        {student.email && (
          <Box display="flex" alignItems="center" mb={1}>
            <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {student.email}
            </Typography>
          </Box>
        )}

        {student.parentContact?.phoneNumber && (
          <Box display="flex" alignItems="center" mb={1}>
            <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {student.parentContact.phoneNumber}
            </Typography>
          </Box>
        )}

        {student.skills && student.skills.length > 0 && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" mb={1}>
              Skills:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {student.skills.slice(0, 3).map((skill, index) => (
                <Chip key={index} label={skill} size="small" variant="outlined" />
              ))}
              {student.skills.length > 3 && (
                <Chip label={`+${student.skills.length - 3}`} size="small" variant="outlined" />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header Section */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                🎓 Students Directory
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 600 }}>
                Manage and browse all students at Qatar Science and Technology Secondary School.
                Track academic progress, contact information, and more.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip 
                  label={`${pagination.total} Total Students`}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip 
                  label={`${availableGrades.length} Grade Levels`}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Box>
            {user?.role === 'admin' && (
              <Tooltip title="Add New Student">
                <Fab 
                  color="secondary"
                  onClick={() => setAddDialogOpen(true)}
                  sx={{ 
                    boxShadow: 6,
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <AddIcon sx={{ fontSize: 32 }} />
                </Fab>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {/* Background decoration */}
        <Box 
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
            zIndex: 0
          }}
        />
      </Paper>

      {!isAuthenticated && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please log in to access the students directory.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SearchIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            Search & Filter Students
          </Typography>
        </Box>
        <Grid container spacing={3} alignItems="center">
          {/* Search Field */}
          <Grid item xs={12} lg={4}>
            <TextField
              fullWidth
              placeholder="Search students by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          {/* Grade Filter */}
          <Grid item xs={12} sm={6} lg={3}>
            <FormControl fullWidth>
              <InputLabel>Grade Level</InputLabel>
              <Select
                value={selectedGrade}
                label="Grade Level"
                onChange={(e) => {
                  const newGrade = e.target.value;
                  console.log('🎯 Grade selected:', newGrade);
                  console.log('📊 Available grades:', availableGrades);
                  setSelectedGrade(newGrade);
                  // Reset class when grade changes
                  setSelectedClass('');
                  console.log('✅ Grade filter updated, class filter reset');
                  
                  // Update URL parameters
                  const newParams = new URLSearchParams(searchParams);
                  if (newGrade) {
                    newParams.set('grade', newGrade);
                  } else {
                    newParams.delete('grade');
                  }
                  newParams.delete('class'); // Reset class when grade changes
                  setSearchParams(newParams);
                  console.log('🔗 URL updated with grade filter:', newGrade);
                }}
                sx={{ borderRadius: 2 }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 400
                    }
                  }
                }}
              >
                <MenuItem value="">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 1, fontSize: 18 }} />
                    All Grades
                  </Box>
                </MenuItem>
                
                {/* Render all available grades */}
                {availableGrades.map((grade) => {
                  console.log('🎯 Rendering grade option:', grade);
                  
                  // Determine the display text
                  let displayText = `Grade ${grade}`;
                  let icon = '📚';
                  
                  if (grade === '9') {
                    displayText = '📚 Grade 9';
                  } else if (grade === '10') {
                    displayText = '📚 Grade 10';
                  } else if (grade === '11-Engineering') {
                    displayText = '🔧 Grade 11 - Engineering';
                    icon = '🔧';
                  } else if (grade === '11-IT') {
                    displayText = '💻 Grade 11 - Information Technology';
                    icon = '💻';
                  } else if (grade === '11-Medical') {
                    displayText = '🏥 Grade 11 - Medical Sciences';
                    icon = '🏥';
                  } else if (grade === '12-Engineering') {
                    displayText = '🔧 Grade 12 - Engineering';
                    icon = '🔧';
                  } else if (grade === '12-IT') {
                    displayText = '💻 Grade 12 - Information Technology';
                    icon = '💻';
                  } else if (grade === '12-Medical') {
                    displayText = '🏥 Grade 12 - Medical Sciences';
                    icon = '🏥';
                  }
                  
                  return (
                    <MenuItem 
                      key={grade} 
                      value={grade}
                      sx={{
                        minHeight: 48,
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.08)'
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(25, 118, 210, 0.12)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <SchoolIcon sx={{ mr: 1, fontSize: 18 }} />
                        {displayText}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          {/* Class Filter */}
          <Grid item xs={12} sm={6} lg={3}>
            <FormControl fullWidth>
              <InputLabel>Class Section</InputLabel>
              <Select
                value={selectedClass}
                label="Class Section"
                onChange={(e) => setSelectedClass(e.target.value)}
                sx={{ borderRadius: 2 }}
                disabled={!selectedGrade && filteredClasses.length > 20} // Disable if too many classes and no grade selected
              >
                <MenuItem value="">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                    All Classes {selectedGrade ? `(Grade ${selectedGrade})` : ''}
                  </Box>
                </MenuItem>
                {filteredClasses.sort().map((className) => (
                  <MenuItem key={className} value={className}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                      Class {className}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Results Summary */}
          <Grid item xs={12} lg={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">
                {pagination.total}
              </Typography>
              <Typography variant="caption">
                {searchTerm || selectedGrade || selectedClass ? 'Filtered' : 'Total'} Students
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filter Summary */}
        {(searchTerm || selectedGrade || selectedClass) && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Active filters:
            </Typography>
            {searchTerm && (
              <Chip 
                label={`Search: "${searchTerm}"`} 
                onDelete={() => setSearchTerm('')}
                size="small"
                color="primary"
              />
            )}
            {selectedGrade && (
              <Chip 
                label={`Grade: ${selectedGrade}`} 
                onDelete={() => {
                  setSelectedGrade('');
                  setSelectedClass('');
                }}
                size="small"
                color="secondary"
              />
            )}
            {selectedClass && (
              <Chip 
                label={`Class: ${selectedClass}`} 
                onDelete={() => setSelectedClass('')}
                size="small"
                color="info"
              />
            )}
            <Button 
              size="small" 
              onClick={() => {
                setSearchTerm('');
                setSelectedGrade('');
                setSelectedClass('');
              }}
              sx={{ ml: 1 }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Paper>

      {loading ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
            Loading students...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we fetch the student data
          </Typography>
        </Paper>
      ) : (
        <>          
          <Grid container spacing={3}>
            {(students || []).map((student, index) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                md={4} 
                lg={3} 
                key={student._id}
                sx={{
                  animation: 'fadeInUp 0.5s ease-out',
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both',
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  }
                }}
              >
                <StudentCard student={student} />
              </Grid>
            ))}
          </Grid>

          {students.length === 0 && !loading && (
            <Paper 
              sx={{ 
                p: 8, 
                textAlign: 'center', 
                bgcolor: 'grey.50',
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 3
              }}
            >
              <PersonIcon sx={{ fontSize: 80, color: 'primary.light', mb: 2 }} />
              <Typography variant="h5" color="primary.main" fontWeight="bold" gutterBottom>
                No Students Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
                {searchTerm || selectedGrade || selectedClass 
                  ? 'No students match your current search criteria. Try adjusting your filters or search terms.'
                  : 'No students are currently registered in the system. Students will appear here once they are added to the database.'
                }
              </Typography>
              {(searchTerm || selectedGrade || selectedClass) && (
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGrade('');
                    setSelectedClass('');
                  }}
                  sx={{ mt: 2 }}
                >
                  Clear All Filters
                </Button>
              )}
            </Paper>
          )}

          {pagination.pages > 1 && (
            <Paper 
              sx={{ 
                p: 3, 
                mt: 4, 
                display: 'flex', 
                justifyContent: 'center',
                bgcolor: 'background.paper',
                borderRadius: 3,
                boxShadow: 2
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Showing {((pagination.current - 1) * 20) + 1} to {Math.min(pagination.current * 20, pagination.total)} of {pagination.total} students
                </Typography>
                <Pagination
                  count={pagination.pages}
                  page={pagination.current}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontSize: '1rem',
                      minWidth: '44px',
                      height: '44px',
                      borderRadius: 2,
                      fontWeight: 'bold'
                    },
                    '& .Mui-selected': {
                      boxShadow: 2
                    }
                  }}
                />
              </Box>
            </Paper>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={2}>
              <Typography variant="caption">
                Debug: Page {pagination.current} of {pagination.pages} | Total: {pagination.total} students
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Add Student Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              Add New Student
            </Box>
            <Button 
              onClick={() => setAddDialogOpen(false)}
              sx={{ minWidth: 'auto', p: 1 }}
            >
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={newStudent.grade}
                  label="Grade"
                  onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
                >
                  {grades.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      Grade {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Class</InputLabel>
                <Select
                  value={newStudent.class}
                  label="Class"
                  onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                >
                  {classes.map((className) => (
                    <MenuItem key={className} value={className}>
                      {className}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email (Optional)"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                placeholder="Will auto-generate if not provided"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's Name"
                value={newStudent.parentContact.fatherName}
                onChange={(e) => setNewStudent({
                  ...newStudent, 
                  parentContact: {...newStudent.parentContact, fatherName: e.target.value}
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mother's Name"
                value={newStudent.parentContact.motherName}
                onChange={(e) => setNewStudent({
                  ...newStudent, 
                  parentContact: {...newStudent.parentContact, motherName: e.target.value}
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Phone Number"
                value={newStudent.parentContact.phoneNumber}
                onChange={(e) => setNewStudent({
                  ...newStudent, 
                  parentContact: {...newStudent.parentContact, phoneNumber: e.target.value}
                })}
                placeholder="+974XXXXXXXX"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Email"
                type="email"
                value={newStudent.parentContact.email}
                onChange={(e) => setNewStudent({
                  ...newStudent, 
                  parentContact: {...newStudent.parentContact, email: e.target.value}
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setAddDialogOpen(false)}
            disabled={addingStudent}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddStudent}
            variant="contained"
            disabled={addingStudent || !newStudent.firstName || !newStudent.lastName || !newStudent.grade || !newStudent.class}
            startIcon={addingStudent ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {addingStudent ? 'Adding...' : 'Add Student'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Students;
