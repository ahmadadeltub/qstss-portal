import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Fade,
  LinearProgress,
  Stack,
  Paper
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  variant?: 'circular' | 'linear' | 'fullscreen';
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  variant = 'circular',
  overlay = false
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      default: return 40;
    }
  };

  const loadingComponent = (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{
        minHeight: variant === 'fullscreen' ? '100vh' : '200px',
        width: '100%'
      }}
    >
      {variant === 'fullscreen' && (
        <Fade in timeout={800}>
          <SchoolIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        </Fade>
      )}
      
      {variant === 'linear' ? (
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LinearProgress />
        </Box>
      ) : (
        <Fade in timeout={600}>
          <CircularProgress 
            size={getSize()} 
            thickness={4}
            sx={{ color: 'primary.main' }}
          />
        </Fade>
      )}
      
      <Fade in timeout={1000}>
        <Typography 
          variant={variant === 'fullscreen' ? 'h6' : 'body2'} 
          color="text.secondary"
          align="center"
        >
          {message}
        </Typography>
      </Fade>

      {variant === 'fullscreen' && (
        <Fade in timeout={1200}>
          <Typography variant="body2" color="text.disabled" align="center">
            {process.env.REACT_APP_SCHOOL_NAME}
          </Typography>
        </Fade>
      )}
    </Stack>
  );

  if (overlay) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {loadingComponent}
        </Paper>
      </Box>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'background.default',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {loadingComponent}
      </Box>
    );
  }

  return loadingComponent;
};

export default LoadingSpinner;
