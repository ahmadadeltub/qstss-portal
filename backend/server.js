const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

console.log('Starting Teacher Portal server...');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased for development)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.CORS_ORIGIN, // Dynamic CORS for LAN
    'http://localhost:3001', // Main frontend port
    'http://localhost:4001', // Frontend development port
    'http://localhost:4002', // Previous frontend port
    'http://localhost:4003', // Current frontend port
    'http://localhost:4004', // Additional frontend port
    'http://localhost:4005', // Latest frontend port
    'http://localhost:5001', // Additional port for development
    'http://localhost:5002', // Alternative frontend port
    'http://localhost:5000', // Alternative frontend port
    // LAN access patterns
    /^http:\/\/192\.168\.1\.\d+:3001$/,
    /^http:\/\/192\.168\.0\.\d+:3001$/,
    /^http:\/\/10\.0\.0\.\d+:3001$/,
    /^http:\/\/172\.16\.\d+\.\d+:3001$/,
    /^http:\/\/192\.168\.\d+\.\d+:3001$/
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('Middleware configured');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher-portal';
console.log('Connecting to MongoDB at:', mongoUri);

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Don't exit, continue for now
  });

console.log('Loading routes...');

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('Auth routes loaded');
  
  app.use('/api/students', require('./routes/students'));
  console.log('Students routes loaded');
  
  app.use('/api/competitions', require('./routes/competitions'));
  console.log('Competitions routes loaded');
  
  app.use('/api/registrations', require('./routes/registrations'));
  console.log('Registrations routes loaded');
  
  app.use('/api/teachers', require('./routes/teachers'));
  console.log('Teachers routes loaded');
  
  app.use('/api/reports', require('./routes/reports'));
  console.log('Reports routes loaded');
  
  app.use('/api/notifications', require('./routes/notifications'));
  console.log('Notifications routes loaded');
} catch (error) {
  console.error('Error loading routes:', error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Catch-all for undefined routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;

console.log('Starting server on port', PORT);

// Create HTTP server and initialize Socket.IO
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4001',
      'http://localhost:4002',
      'http://localhost:4003',
      'http://localhost:4004',
      'http://localhost:4005',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://localhost:5002',
      // LAN access patterns
      /^http:\/\/192\.168\.1\.\d+:3001$/,
      /^http:\/\/192\.168\.0\.\d+:3001$/,
      /^http:\/\/10\.0\.0\.\d+:3001$/,
      /^http:\/\/172\.16\.\d+\.\d+:3001$/,
      /^http:\/\/192\.168\.\d+\.\d+:3001$/
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize notification service
const notificationService = require('./services/notificationService');
notificationService.initialize(io);

// Initialize competition monitor service
const competitionMonitor = require('./services/competitionMonitor');

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔔 Socket.IO notification service active`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start competition monitoring
  competitionMonitor.start();
  
  console.log('Server ready for requests!');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  
  // Stop competition monitor
  competitionMonitor.stop();
  
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
