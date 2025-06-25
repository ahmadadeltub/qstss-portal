import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Initialize Firebase Admin
admin.initializeApp();

// Import routes
import { authRoutes } from './routes/auth';
import { studentRoutes } from './routes/students';
import { teacherRoutes } from './routes/teachers';
import { competitionRoutes } from './routes/competitions';
import { registrationRoutes } from './routes/registrations';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'QSTSS Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/competitions', competitionRoutes);
app.use('/registrations', registrationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
