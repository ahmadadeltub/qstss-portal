import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

// Get all students
router.get('/', async (req, res) => {
  try {
    const studentsRef = db.collection('students');
    const snapshot = await studentsRef.orderBy('lastName').get();
    
    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('students').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create new student
router.post('/', async (req, res) => {
  try {
    const studentData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('students').add(studentData);
    
    res.status(201).json({
      id: docRef.id,
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('students').doc(req.params.id).update(updateData);
    
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('students').doc(req.params.id).delete();
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

export { router as studentRoutes };
