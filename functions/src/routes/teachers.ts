import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

// Get all teachers
router.get('/', async (req, res) => {
  try {
    const teachersRef = db.collection('teachers');
    const snapshot = await teachersRef.orderBy('lastName').get();
    
    const teachers = snapshot.docs.map(doc => {
      const data = doc.data();
      // Remove password from response
      const { password, ...teacherData } = data;
      return {
        id: doc.id,
        ...teacherData
      };
    });

    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Get teacher by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('teachers').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const data = doc.data();
    // Remove password from response
    const { password, ...teacherData } = data;
    
    res.json({ id: doc.id, ...teacherData });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

// Update teacher
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Remove password if it's empty
    if (!updateData.password) {
      delete updateData.password;
    }

    await db.collection('teachers').doc(req.params.id).update(updateData);
    
    res.json({ message: 'Teacher updated successfully' });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// Delete teacher
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('teachers').doc(req.params.id).delete();
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

export { router as teacherRoutes };
