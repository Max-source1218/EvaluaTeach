import express from 'express';
import Evaluation from '../models/Evaluation.js';
import protectRouteStudent from '../middleware/student.middleware.js'; // Assuming student auth

const router = express.Router();

// POST: Create evaluation
router.post('/', protectRouteStudent, async (req, res) => {
    try {
        const { title, semester, schoolyear, instructorId, userId, department, points } = req.body;

        if (!title || !semester || !schoolyear || !instructorId || !userId || !department || points === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newEvaluation = new Evaluation({
            title,
            semester,
            schoolyear,
            instructorId,
            userId,
            department,
            points,
        });

        await newEvaluation.save();
        res.status(201).json({ message: 'Evaluation submitted successfully', evaluation: newEvaluation });
    } catch (error) {
        console.error('Error creating evaluation:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;