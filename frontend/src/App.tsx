import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import RealTimeNotificationWrapper from './components/RealTimeNotificationWrapper';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Competitions from './pages/Competitions';
import MyRegistrations from './pages/MyRegistrations';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import './App.css';

// Professional theme configuration for Qatar Science & Technology Secondary School
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Professional blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e', // Qatar flag red accent
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#5a6c7d',
    },
    success: {
      main: '#28a745',
      light: '#6bcf7f',
      dark: '#1e7e34',
    },
    warning: {
      main: '#ffc107',
      light: '#ffecb3',
      dark: '#ff8f00',
    },
    error: {
      main: '#dc3545',
      light: '#ef5350',
      dark: '#c62828',
    },
    info: {
      main: '#17a2b8',
      light: '#4fc3f7',
      dark: '#0277bd',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.04)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          boxShadow: '0 2px 12px rgba(25,118,210,0.2)',
        },
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <NotificationProvider>
            <RealTimeNotificationWrapper>
              <Router>
              <Suspense fallback={<LoadingSpinner variant="fullscreen" message="Loading Application..." />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes */}
                  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    
                    {/* Admin Only Routes for Students, Teachers, Competitions */}
                    <Route 
                      path="students" 
                      element={
                        <ProtectedAdminRoute>
                          <Students />
                        </ProtectedAdminRoute>
                      } 
                    />
                    <Route 
                      path="teachers" 
                      element={
                        <ProtectedAdminRoute>
                          <Teachers />
                        </ProtectedAdminRoute>
                      } 
                    />
                    <Route 
                      path="competitions" 
                      element={
                        <ProtectedAdminRoute>
                          <Competitions />
                        </ProtectedAdminRoute>
                      } 
                    />
                    
                    {/* Routes available to all authenticated users */}
                    <Route path="my-registrations" element={<MyRegistrations />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="notifications" element={<Notifications />} />
                    
                    {/* Admin Panel */}
                    <Route 
                      path="admin" 
                      element={
                        <ProtectedAdminRoute>
                          <AdminPanel />
                        </ProtectedAdminRoute>
                      } 
                    />
                  </Route>
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>            
              </Router>
            </RealTimeNotificationWrapper>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;