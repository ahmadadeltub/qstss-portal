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
exports.teacherRoutes = void 0;
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const router = (0, express_1.Router)();
exports.teacherRoutes = router;
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({ error: 'Failed to update teacher' });
    }
});
// Delete teacher
router.delete('/:id', async (req, res) => {
    try {
        await db.collection('teachers').doc(req.params.id).delete();
        res.json({ message: 'Teacher deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ error: 'Failed to delete teacher' });
    }
});
