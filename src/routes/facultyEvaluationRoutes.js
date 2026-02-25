// routes/facultyEvaluationRoutes.js
import express from 'express';
import Faculty_Evaluation from '../models/Faculty_Evaluation.js';
import Supervisor_Detail from '../models/SupervisorForm.js'; 
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protectRoute, async (req, res) => {
    try {
        const { title, semester, schoolyear, facultyId, userId, department, points } = req.body;

        if (!title || !semester || !schoolyear || !facultyId || !userId || !department || points === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const supervisorDetail = await Supervisor_Detail.findOne({ user: userId });
        if (!supervisorDetail) {
            return res.status(404).json({ message: 'Program Chair details not found' });
        }

        const newEvaluation = new Faculty_Evaluation({
            title,
            semester,
            schoolyear,
            facultyId,
            userId,
            department,
            name: supervisorDetail.name,
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