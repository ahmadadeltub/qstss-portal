import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

// Get all registrations
router.get('/', async (req, res) => {
  try {
    const registrationsRef = db.collection('registrations');
    const snapshot = await registrationsRef.orderBy('createdAt', 'desc').get();
    
    const registrations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Get registrations by competition
router.get('/competition/:competitionId', async (req, res) => {
  try {
    const registrationsRef = db.collection('registrations');
    const snapshot = await registrationsRef
      .where('competitionId', '==', req.params.competitionId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const registrations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations by competition:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Create new registration
router.post('/', async (req, res) => {
  try {
    const registrationData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('registrations').add(registrationData);
    
    res.status(201).json({
      id: docRef.id,
      message: 'Registration created successfully'
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ error: 'Failed to create registration' });
  }
});

// Update registration
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('registrations').doc(req.params.id).update(updateData);
    
    res.json({ message: 'Registration updated successfully' });
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

// Delete registration
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('registrations').doc(req.params.id).delete();
    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

export { router as registrationRoutes };
