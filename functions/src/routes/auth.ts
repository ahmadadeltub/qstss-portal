import { Router } from 'express';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';

const router = Router();
const db = admin.firestore();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if it's admin login
    if (email === 'admin@qstss.edu.qa' && password === 'admin123') {
      const customToken = await admin.auth().createCustomToken('admin', {
        role: 'admin',
        email: 'admin@qstss.edu.qa',
        name: 'Administrator'
      });
      
      return res.json({
        token: customToken,
        user: {
          id: 'admin',
          email: 'admin@qstss.edu.qa',
          name: 'Administrator',
          role: 'admin'
        }
      });
    }

    // Check teachers collection
    const teachersRef = db.collection('teachers');
    const snapshot = await teachersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const teacherDoc = snapshot.docs[0];
    const teacher = teacherDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, teacher.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create custom token
    const customToken = await admin.auth().createCustomToken(teacherDoc.id, {
      role: 'teacher',
      email: teacher.email,
      name: `${teacher.firstName} ${teacher.lastName}`,
      department: teacher.department
    });

    res.json({
      token: customToken,
      user: {
        id: teacherDoc.id,
        email: teacher.email,
        name: `${teacher.firstName} ${teacher.lastName}`,
        role: 'teacher',
        department: teacher.department,
        subjects: teacher.subjects || []
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register teacher (admin only)
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, department, subjects, phoneNumber } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if teacher already exists
    const teachersRef = db.collection('teachers');
    const existingSnapshot = await teachersRef.where('email', '==', email).get();
    
    if (!existingSnapshot.empty) {
      return res.status(400).json({ error: 'Teacher with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Process subjects
    let subjectsArray = [];
    if (subjects) {
      if (typeof subjects === 'string') {
        subjectsArray = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (Array.isArray(subjects)) {
        subjectsArray = subjects;
      }
    }
    
    if (subjectsArray.length === 0) {
      subjectsArray = ['General'];
    }

    // Create teacher document
    const teacherData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      department,
      subjects: subjectsArray,
      phoneNumber: phoneNumber || '',
      role: 'teacher',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await teachersRef.add(teacherData);

    res.status(201).json({
      message: 'Teacher registered successfully',
      teacher: {
        id: docRef.id,
        email,
        firstName,
        lastName,
        department,
        subjects: subjectsArray
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export { router as authRoutes };
