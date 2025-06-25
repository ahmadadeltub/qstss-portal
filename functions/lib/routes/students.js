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
exports.studentRoutes = void 0;
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const router = (0, express_1.Router)();
exports.studentRoutes = router;
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
});
// Delete student
router.delete('/:id', async (req, res) => {
    try {
        await db.collection('students').doc(req.params.id).delete();
        res.json({ message: 'Student deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
});
