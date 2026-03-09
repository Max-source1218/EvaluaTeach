import express from 'express';
import Faculty_Evaluation from '../models/Faculty_Evaluation.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// ─── ROLE GUARD ────────────────────────────────────────────────────────────
const requireSupervisor = (req, res, next) => {
    if (req.user.role !== 'Supervisor') {
        return res.status(403).json({ message: 'Access denied - Supervisors only' });
    }
    next();
};

// ─── SUBMIT FACULTY EVALUATION ─────────────────────────────────────────────
router.post('/', protectRoute, async (req, res) => {
    try {
        const { title, semester, schoolyear, facultyId, department, points, name } = req.body;

        // ✅ Use authenticated user's _id — never trust client-sent userId
        const userId = req.user._id;

        if (!title || !semester || !schoolyear || !facultyId || !department) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // ✅ Proper points validation
        if (points === undefined || points === null) {
            return res.status(400).json({ message: 'Points are required' });
        }

        // ✅ Prevent duplicate evaluations
        const existing = await Faculty_Evaluation.findOne({
            userId,
            facultyId,
            title,
            semester,
            schoolyear,
        });
        if (existing) {
            return res.status(409).json({
                message: 'You have already submitted an evaluation for this faculty member this semester.'
            });
        }

        const newEvaluation = new Faculty_Evaluation({
            title,
            semester,
            schoolyear,
            facultyId,
            userId,                  // ✅ from req.user, not req.body
            department,
            name: name || 'Unknown',
            points,
        });

        await newEvaluation.save();
        res.status(201).json({ message: 'Evaluation submitted successfully', evaluation: newEvaluation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET EVALUATIONS BY FACULTY ────────────────────────────────────────────
router.get('/faculty/:facultyId', protectRoute, async (req, res) => {
    try {
        const evaluations = await Faculty_Evaluation.find({ facultyId: req.params.facultyId })
            .sort({ createdAt: -1 });
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET EVALUATIONS BY USER (Program Chair) ───────────────────────────────
router.get('/user/:userId', protectRoute, async (req, res) => {
    try {
        const evaluations = await Faculty_Evaluation.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET ALL EVALUATIONS — SUPERVISOR ONLY ─────────────────────────────────
router.get('/all', protectRoute, requireSupervisor, async (req, res) => {
    try {
        const evaluations = await Faculty_Evaluation.find()
            .populate('facultyId', 'username department')
            .populate('userId', 'username')
            .sort({ createdAt: -1 });
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;