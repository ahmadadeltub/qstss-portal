import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, CircularProgress, Chip, Button, LinearProgress,
  IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select,
  MenuItem, Alert, Badge, useTheme, Avatar
} from '@mui/material';
import {
  Download, School, EmojiEvents, People, TrendingUp,
  Analytics, Assessment, 
  Refresh, FilterList, MoreVert,
  CalendarToday, Group, Person, Business,
  CheckCircle, Error as ErrorIcon, Info
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface ReportData {
  summary: {
    totalStudents: number;
    totalCompetitions: number;
    totalRegistrations: number;
    totalTeachers: number;
  };
  competitions: Array<{
    _id: string;
    name: string;
    category: string;
    status: string;
    registrationCount: number;
    maxParticipants: number;
    registrationDeadline: string;
  }>;
  students: Array<{
    _id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    grade: string;
    class: string;
    registrationCount: number;
  }>;
  teachers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    department: string;
    registrationCount: number;
    studentCount: number;
  }>;
  participationTrends?: Array<{
    category: string;
    participantCount: number;
    uniqueStudentCount: number;
    participationRate: number;
  }>;
  gradeDistribution?: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
}

const Reports: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(async () => {
    try {
      console.log('🔄 Fetching reports data...');
      console.log('📍 User context:', user);
      console.log('📍 Auth token exists:', !!localStorage.getItem('token'));
      
      setRefreshing(true);
      setError(null);
      
      const response = await apiService.getDashboardStats();
      console.log('✅ Raw API response:', response);
      
      // For teachers, filter data to only show their own information
      if (user?.role === 'teacher') {
        const teacherData = response.teachers?.find((t: any) => t._id === user.id) || {
          registrationCount: 0,
          studentCount: 0
        };
        
        // Get teacher's own registrations
        const teacherRegistrations = await apiService.getMyRegistrations();
        
        // Transform data for teacher view
        const transformedData: ReportData = {
          summary: {
            totalStudents: teacherData.studentCount || response.stats?.myRegistrations || 0,
            totalCompetitions: teacherRegistrations?.length || 0,
            totalRegistrations: teacherData.registrationCount || 0,
            totalTeachers: 1 // Only show themselves
          },
          competitions: teacherRegistrations?.map((reg: any) => ({
            _id: reg.competition._id,
            name: reg.competition.name,
            category: reg.competition.category,
            status: reg.competition.status,
            registrationCount: reg.students?.length || 0,
            maxParticipants: reg.competition.maxParticipants || 0,
            registrationDeadline: reg.competition.registrationDeadline
          })) || [],
          students: [], // Teachers don't see all students data
          teachers: [{
            _id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            department: user.department || 'N/A',
            registrationCount: teacherData.registrationCount || 0,
            studentCount: teacherData.studentCount || 0
          }],
          participationTrends: [],
          gradeDistribution: []
        };
        
        setReportData(transformedData);
      } else {
        // Admin view - show all data
        const transformedData: ReportData = {
          summary: response.summary || response.stats || {
            totalStudents: 0,
            totalCompetitions: 0,
            totalRegistrations: 0,
            totalTeachers: 0
          },
          competitions: response.competitions || [],
          students: response.students || [],
          teachers: response.teachers || [],
          participationTrends: response.participationTrends || [],
          gradeDistribution: response.gradeDistribution || []
        };
        
        setReportData(transformedData);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching report data:', err);
      
      let errorMessage = 'Failed to load reports data. Please try again.';
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view reports.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchReportData();
    } else {
      setLoading(false);
      setError('Please log in to view reports');
    }
  }, [user, fetchReportData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <CalendarToday fontSize="small" />;
      case 'active': return <CheckCircle fontSize="small" />;
      case 'completed': return <Info fontSize="small" />;
      case 'cancelled': return <ErrorIcon fontSize="small" />;
      default: return <Info fontSize="small" />;
    }
  };

  const exportReport = async (type: string) => {
    try {
      console.log(`🔄 Exporting ${type} report...`);
      
      const response = await apiService.get(`/reports/export/${type}`, {
        responseType: 'blob'
      });
      
      console.log('✅ Export response received:', response);
      
      // Handle different response types
      let blob;
      if (response instanceof Blob) {
        blob = response;
      } else if (response.data instanceof Blob) {
        blob = response.data;
      } else if (typeof response === 'string') {
        blob = new Blob([response], { type: 'text/csv' });
      } else if (typeof response.data === 'string') {
        blob = new Blob([response.data], { type: 'text/csv' });
      } else {
        console.error('❌ Unexpected response format:', response);
        throw new Error('Invalid response format');
      }
      
      if (blob.size === 0) {
        throw new Error('Export file is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${type}_report_${timestamp}.csv`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setExportDialogOpen(false);
      console.log(`✅ ${type} report exported successfully as ${filename}`);
      
    } catch (err: any) {
      console.error('❌ Error exporting report:', err);
      setError(`Failed to export ${type} report: ${err.message || 'Unknown error'}`);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    change?: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, change, subtitle }) => (
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
          {change && (
            <Chip 
              label={change}
              size="small" 
              color={change.startsWith('+') ? 'success' : 'error'}
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: color, mb: 1 }}>
          {value.toLocaleString()}
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

  if (loading || !reportData) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Box textAlign="center">
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Loading Analytics Dashboard...
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box display="flex" justifyContent="center">
            <Button 
              variant="contained" 
              onClick={fetchReportData}
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
        {/* Debug Information - Commented out for production */}
        {false && process.env.NODE_ENV === 'development' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Debug Info:</strong> Loading: {loading.toString()}, Error: {error || 'none'}, 
            Data: {reportData ? 'loaded' : 'null'}, User: {user?.firstName || 'none'}, 
            Token: {localStorage.getItem('token') ? 'exists' : 'missing'}
          </Alert>
        )}
        
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
                📊 Analytics & Reports
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Qatar Science & Technology Secondary School
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                Comprehensive insights into student performance, competition analytics, and institutional metrics
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton 
                  color="inherit" 
                  onClick={fetchReportData}
                  disabled={refreshing}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Options">
                <IconButton 
                  color="inherit"
                  onClick={() => setExportDialogOpen(true)}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Key Performance Indicators */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Total Students"
              value={reportData.summary.totalStudents}
              icon={<School sx={{ fontSize: 32 }} />}
              color={theme.palette.primary.main}
              change="+5.2%"
              subtitle="Active enrollment"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Active Competitions"
              value={reportData.summary.totalCompetitions}
              icon={<EmojiEvents sx={{ fontSize: 32 }} />}
              color={theme.palette.warning.main}
              change="+12.3%"
              subtitle="Running & upcoming"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Total Registrations"
              value={reportData.summary.totalRegistrations}
              icon={<People sx={{ fontSize: 32 }} />}
              color={theme.palette.success.main}
              change="+8.7%"
              subtitle="All time registrations"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Teaching Staff"
              value={reportData.summary.totalTeachers}
              icon={<Person sx={{ fontSize: 32 }} />}
              color={theme.palette.info.main}
              change="+2.1%"
              subtitle="Active teachers"
            />
          </Grid>
        </Grid>

        {/* Quick Insights Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp color="success" />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Participation Trends
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Student engagement across all competition categories
                </Typography>
                {reportData.participationTrends && reportData.participationTrends.length > 0 ? (
                  reportData.participationTrends.slice(0, 3).map((trend, index) => (
                    <Box key={trend.category} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{trend.category}</Typography>
                        <Typography variant="body2">{trend.participationRate}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={trend.participationRate} 
                        color={index === 0 ? 'success' : index === 1 ? 'primary' : 'warning'} 
                      />
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No participation data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assessment color="primary" />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Grade Distribution
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Student distribution across grade levels
                </Typography>
                {reportData.gradeDistribution && reportData.gradeDistribution.length > 0 ? (
                  reportData.gradeDistribution.map((gradeData, index) => (
                    <Box key={gradeData.grade} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Grade {gradeData.grade}</Typography>
                        <Typography variant="body2">{gradeData.percentage}% ({gradeData.count} students)</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={gradeData.percentage} 
                        color={index % 2 === 0 ? 'primary' : 'secondary'}
                      />
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No grade distribution data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Analytics color="info" />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Top Performers
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Most active students this semester
                </Typography>
                {reportData.students.slice(0, 5).map((student, index) => (
                  <Box key={student._id} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 2,
                      bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'grey.400',
                      fontSize: '0.875rem'
                    }}>
                      {index + 1}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {student.firstName} {student.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Grade {student.grade} • {student.registrationCount} competitions
                      </Typography>
                    </Box>
                    <Badge badgeContent={student.registrationCount} color="primary" />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Reports Tabs */}
        <Paper sx={{ width: '100%', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'grey.50'
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="reports tabs"
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  py: 2
                }
              }}
            >
              {user?.role === 'admin' ? (
                <>
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents />
                        Competitions Analytics
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School />
                        Student Performance
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People />
                        Teacher Activity
                      </Box>
                    } 
                  />
                </>
              ) : (
                <>
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents />
                        My Competitions
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assessment />
                        My Activity
                      </Box>
                    } 
                  />
                </>
              )}
            </Tabs>
          </Box>

          {/* Competition/My Competitions Report */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {user?.role === 'admin' ? '🏆 Competition Performance Dashboard' : '🏆 My Competitions'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {user?.role === 'admin' 
                      ? 'Detailed analysis of competition registration and participation metrics'
                      : 'Overview of competitions you have registered students for'
                    }
                  </Typography>
                </Box>
                {user?.role === 'admin' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      startIcon={<FilterList />}
                      variant="outlined"
                      size="small"
                    >
                      Filter
                    </Button>
                    <Button 
                      startIcon={<Download />}
                      onClick={() => exportReport('competitions')}
                      variant="contained"
                      size="small"
                    >
                      Export Data
                    </Button>
                  </Box>
                )}
              </Box>
              
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Competition Details</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        {user?.role === 'admin' ? 'Total Registrations' : 'My Students'}
                      </TableCell>
                      {user?.role === 'admin' && (
                        <>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Capacity</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Fill Rate</TableCell>
                        </>
                      )}
                      <TableCell sx={{ fontWeight: 'bold' }}>Deadline</TableCell>
                      {user?.role === 'admin' && (
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.competitions.map((competition) => {
                      const fillRate = user?.role === 'admin' 
                        ? Math.round((competition.registrationCount / competition.maxParticipants) * 100)
                        : 0;
                      return (
                        <TableRow key={competition._id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {competition.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {competition._id.slice(-6)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={competition.category}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              icon={getStatusIcon(competition.status)}
                              label={competition.status.charAt(0).toUpperCase() + competition.status.slice(1)} 
                              color={getStatusColor(competition.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {competition.registrationCount}
                            </Typography>
                          </TableCell>
                          {user?.role === 'admin' && (
                            <>
                              <TableCell align="center">{competition.maxParticipants}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(fillRate, 100)} 
                                    sx={{ width: 40, height: 6, borderRadius: 3 }}
                                    color={fillRate >= 80 ? 'success' : fillRate >= 50 ? 'warning' : 'error'}
                                  />
                                  <Chip 
                                    label={`${fillRate}%`}
                                    size="small"
                                    color={fillRate >= 80 ? 'success' : fillRate >= 50 ? 'warning' : 'error'}
                                    variant="outlined"
                                  />
                                </Box>
                              </TableCell>
                            </>
                          )}
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(competition.registrationDeadline).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          {user?.role === 'admin' && (
                            <TableCell align="center">
                              <IconButton size="small" color="primary">
                                <MoreVert />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          {/* Student Report / My Activity */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {user?.role === 'admin' ? '🎓 Student Participation Analytics' : '📊 My Teaching Activity'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {user?.role === 'admin' 
                      ? 'Comprehensive view of student engagement and competition participation'
                      : 'Overview of your teaching performance and student registrations'
                    }
                  </Typography>
                </Box>
                {user?.role === 'admin' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      startIcon={<FilterList />}
                      variant="outlined"
                      size="small"
                    >
                      Filter by Grade
                    </Button>
                    <Button 
                      startIcon={<Download />}
                      onClick={() => exportReport('students')}
                      variant="contained"
                      size="small"
                    >
                      Export Data
                    </Button>
                  </Box>
                )}
              </Box>
              
              {user?.role === 'admin' ? (
                <>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Student Information</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Academic Details</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Competitions</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Participation Level</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Performance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.students
                        .sort((a, b) => b.registrationCount - a.registrationCount)
                        .slice(0, 50)
                        .map((student, index) => {
                          const level = student.registrationCount >= 3 ? 'High' : 
                                       student.registrationCount >= 2 ? 'Medium' : 
                                       student.registrationCount >= 1 ? 'Low' : 'None';
                          const levelColor = student.registrationCount >= 3 ? 'success' : 
                                            student.registrationCount >= 2 ? 'warning' : 
                                            student.registrationCount >= 1 ? 'info' : 'default';
                          
                          return (
                            <TableRow key={student._id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ 
                                    bgcolor: index < 3 ? 'primary.main' : 'grey.400',
                                    width: 36,
                                    height: 36
                                  }}>
                                    {student.firstName[0]}{student.lastName[0]}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {student.firstName} {student.lastName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ID: {student.studentId}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Chip 
                                    label={`Grade ${student.grade}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                  />
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Class {student.class}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Badge badgeContent={student.registrationCount} color="primary">
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
                                <Chip 
                                  label={level}
                                  color={levelColor}
                                  size="small"
                                  icon={level === 'High' ? <TrendingUp /> : undefined}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <LinearProgress 
                                  variant="determinate" 
                                  value={Math.min(student.registrationCount * 25, 100)} 
                                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                                  color={levelColor === 'default' ? 'primary' : levelColor as any}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {reportData.students.length > 50 && (
                    <Alert severity="info" sx={{ mt: 3 }}>
                      <Typography variant="body2">
                        📊 Showing top 50 most active students out of {reportData.students.length} total students. 
                        Export CSV for complete dataset.
                      </Typography>
                    </Alert>
                  )}
                </>
              ) : (
                // Teacher Activity View
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person />
                          Teaching Summary
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Total Registrations:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {reportData.teachers[0]?.registrationCount || 0}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Students Registered:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {reportData.teachers[0]?.studentCount || 0}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Department:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {reportData.teachers[0]?.department || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Analytics />
                          Performance Metrics
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Activity Level
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min((reportData.teachers[0]?.registrationCount || 0) * 20, 100)} 
                            sx={{ mb: 2, height: 8, borderRadius: 4 }}
                            color={
                              (reportData.teachers[0]?.registrationCount || 0) >= 3 ? 'success' : 
                              (reportData.teachers[0]?.registrationCount || 0) >= 2 ? 'warning' : 'info'
                            }
                          />
                          <Typography variant="caption" color="text.secondary">
                            {(reportData.teachers[0]?.registrationCount || 0) >= 3 ? 'Highly Active' : 
                             (reportData.teachers[0]?.registrationCount || 0) >= 2 ? 'Active' : 
                             (reportData.teachers[0]?.registrationCount || 0) >= 1 ? 'Getting Started' : 'New'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          </TabPanel>

          {/* Teacher Report - Admin Only */}
          {user?.role === 'admin' && (
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                      👨‍🏫 Faculty Engagement Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Teacher activity metrics and student mentorship statistics
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      startIcon={<FilterList />}
                      variant="outlined"
                      size="small"
                    >
                      Filter by Department
                    </Button>
                    <Button 
                      startIcon={<Download />}
                      onClick={() => exportReport('teachers')}
                      variant="contained"
                      size="small"
                    >
                      Export Data
                    </Button>
                  </Box>
                </Box>
                
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Teacher Profile</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Registrations</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Students Mentored</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Activity Level</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.teachers
                      .sort((a, b) => b.registrationCount - a.registrationCount)
                      .map((teacher, index) => {
                        const level = teacher.registrationCount >= 3 ? 'High' : 
                                     teacher.registrationCount >= 2 ? 'Medium' : 
                                     teacher.registrationCount >= 1 ? 'Low' : 'None';
                        const levelColor = teacher.registrationCount >= 3 ? 'success' : 
                                          teacher.registrationCount >= 2 ? 'warning' : 
                                          teacher.registrationCount >= 1 ? 'info' : 'default';
                        
                        return (
                          <TableRow key={teacher._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ 
                                  bgcolor: index < 3 ? 'success.main' : 'primary.main',
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
                                    Faculty Member
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={teacher.department}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                icon={<Business fontSize="small" />}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {teacher.registrationCount}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Group fontSize="small" color="action" />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {teacher.studentCount}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={level}
                                color={levelColor}
                                size="small"
                                icon={level === 'High' ? <TrendingUp /> : undefined}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={Math.min(teacher.registrationCount * 20, 100)} 
                                  sx={{ width: 60, height: 8, borderRadius: 4 }}
                                  color={levelColor === 'default' ? 'primary' : levelColor as any}
                                />
                                <Typography variant="caption" sx={{ minWidth: 35 }}>
                                  {Math.min(teacher.registrationCount * 20, 100)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
          )}
        </Paper>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Download />
              Export Reports
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={selectedExportType}
                  onChange={(e) => setSelectedExportType(e.target.value)}
                  label="Report Type"
                >
                  <MenuItem value="comprehensive">📊 Comprehensive Report (All Details)</MenuItem>
                  <MenuItem value="competitions">🏆 Detailed Competitions Report</MenuItem>
                  <MenuItem value="students">👨‍🎓 Student Report</MenuItem>
                  <MenuItem value="teachers">👨‍🏫 Teacher Report</MenuItem>
                  <MenuItem value="registrations">📋 Registrations Report</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="current_semester">Current Semester</MenuItem>
                  <MenuItem value="last_month">Last Month</MenuItem>
                  <MenuItem value="last_week">Last Week</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedExportType && exportReport(selectedExportType)}
              variant="contained"
              disabled={!selectedExportType}
              startIcon={<Download />}
            >
              Export CSV
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Reports;
