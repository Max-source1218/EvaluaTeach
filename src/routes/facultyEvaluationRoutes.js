import express from 'express';
import Faculty_Evaluation from '../models/Faculty_Evaluation.js';
import SupervisorForm from '../models/SupervisorForm.js'; 
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// Create new evaluation
router.post('/', protectRoute, async (req, res) => {
    try {
        const { title, semester, schoolyear, facultyId, userId, department, points, name } = req.body;

        if (!title || !semester || !schoolyear || !facultyId || !userId || !department || points === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newEvaluation = new Faculty_Evaluation({
            title,
            semester,
            schoolyear,
            facultyId,
            userId,
            department,
            name: name || 'Unknown',
            points,
        });

        await newEvaluation.save();
        res.status(201).json({ message: 'Evaluation submitted successfully', evaluation: newEvaluation });
    } catch (error) {
        console.error('Error creating evaluation:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get evaluations for a specific faculty
router.get('/faculty/:facultyId', protectRoute, async (req, res) => {
    try {
        const evaluations = await Faculty_Evaluation.find({ facultyId: req.params.facultyId })
            .sort({ createdAt: -1 });
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get evaluations by a specific user (Program Chair)
router.get('/user/:userId', protectRoute, async (req, res) => {
    try {
        const evaluations = await Faculty_Evaluation.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all evaluations (for admin)
router.get('/all', protectRoute, async (req, res) => {
    try {
        const evaluations = await Faculty_Evaluation.find()
            .populate('facultyId', 'username department')
            .populate('userId', 'username')
            .sort({ createdAt: -1 });
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching all evaluations:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;