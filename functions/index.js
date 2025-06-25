const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'QSTSS Portal API is running on Firebase Functions' });
});

// Simple auth routes
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Demo credentials
    const users = {
      'admin@qstss.edu.qa': { password: 'admin123', role: 'admin', name: 'Admin User' },
      'john.smith@qstss.edu.qa': { password: 'teacher123', role: 'teacher', name: 'John Smith' }
    };
    
    const user = users[email];
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create custom token
    const token = await admin.auth().createCustomToken(email, {
      role: user.role,
      email: email,
      name: user.name
    });
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        email: email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Students routes
app.get('/students', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('students').get();
    const students = [];
    
    snapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

app.post('/students', async (req, res) => {
  try {
    const db = admin.firestore();
    const studentData = req.body;
    
    const docRef = await db.collection('students').add({
      ...studentData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ id: docRef.id, message: 'Student created successfully' });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Error creating student' });
  }
});

// Teachers routes
app.get('/teachers', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('teachers').get();
    const teachers = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Don't send password in response
      const { password, ...teacherData } = data;
      teachers.push({ id: doc.id, ...teacherData });
    });
    
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers' });
  }
});

// Competitions routes
app.get('/competitions', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('competitions').get();
    const competitions = [];
    
    snapshot.forEach(doc => {
      competitions.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(competitions);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ message: 'Error fetching competitions' });
  }
});

app.post('/competitions', async (req, res) => {
  try {
    const db = admin.firestore();
    const competitionData = req.body;
    
    const docRef = await db.collection('competitions').add({
      ...competitionData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ id: docRef.id, message: 'Competition created successfully' });
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ message: 'Error creating competition' });
  }
});

// Registrations routes
app.get('/registrations', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('registrations').get();
    const registrations = [];
    
    snapshot.forEach(doc => {
      registrations.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Error fetching registrations' });
  }
});

app.post('/registrations', async (req, res) => {
  try {
    const db = admin.firestore();
    const registrationData = req.body;
    
    const docRef = await db.collection('registrations').add({
      ...registrationData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ id: docRef.id, message: 'Registration created successfully' });
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ message: 'Error creating registration' });
  }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
