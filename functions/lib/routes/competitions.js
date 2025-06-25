"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitionRoutes = void 0;
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const router = (0, express_1.Router)();
exports.competitionRoutes = router;
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error updating competition:', error);
        res.status(500).json({ error: 'Failed to update competition' });
    }
});
// Delete competition
router.delete('/:id', async (req, res) => {
    try {
        await db.collection('competitions').doc(req.params.id).delete();
        res.json({ message: 'Competition deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting competition:', error);
        res.status(500).json({ error: 'Failed to delete competition' });
    }
});
