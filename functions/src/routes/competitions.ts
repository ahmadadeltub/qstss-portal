import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

// Get all competitions
router.get('/', async (req, res) => {
  try {
    const competitionsRef = db.collection('competitions');
    const snapshot = await competitionsRef.orderBy('createdAt', 'desc').get();
    
    const competitions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(competitions);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// Get competition by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('competitions').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

// Create new competition
router.post('/', async (req, res) => {
  try {
    const competitionData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('competitions').add(competitionData);
    
    res.status(201).json({
      id: docRef.id,
      message: 'Competition created successfully'
    });
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ error: 'Failed to create competition' });
  }
});

// Update competition
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('competitions').doc(req.params.id).update(updateData);
    
    res.json({ message: 'Competition updated successfully' });
  } catch (error) {
    console.error('Error updating competition:', error);
    res.status(500).json({ error: 'Failed to update competition' });
  }
});

// Delete competition
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('competitions').doc(req.params.id).delete();
    res.json({ message: 'Competition deleted successfully' });
  } catch (error) {
    console.error('Error deleting competition:', error);
    res.status(500).json({ error: 'Failed to delete competition' });
  }
});

export { router as competitionRoutes };
