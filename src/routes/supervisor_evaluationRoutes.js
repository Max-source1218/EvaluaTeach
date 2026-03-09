import express from 'express';
import Supervisor_Evaluation from '../models/Supervisor_evaluation.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// ─── SUBMIT SUPERVISOR EVALUATION ──────────────────────────────────────────
router.post('/', protectRoute, async (req, res) => {
    try {
        const { title, semester, schoolyear, instructorId, department, points, name } = req.body;

        // ✅ Use authenticated user's _id — never trust client-sent userId
        const userId = req.user._id;

        if (!title || !semester || !schoolyear || !instructorId || !department) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // ✅ Proper points validation
        if (points === undefined || points === null) {
            return res.status(400).json({ message: 'Points are required' });
        }

        // ✅ Prevent duplicate evaluations
        const existing = await Supervisor_Evaluation.findOne({
            userId,
            instructorId,
            title,
            semester,
            schoolyear,
        });
        if (existing) {
            return res.status(409).json({
                message: 'You have already submitted an evaluation for this program chair this semester.'
            });
        }

        const newEvaluation = new Supervisor_Evaluation({
            title,
            semester,
            schoolyear,
            instructorId,
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

// ─── GET EVALUATIONS BY INSTRUCTOR (Program Chair) ─────────────────────────
router.get('/instructor/:instructorId', protectRoute, async (req, res) => {
    try {
        const { instructorId } = req.params;

        const evaluations = await Supervisor_Evaluation.find({ instructorId })
            .populate('instructorId', 'username department')
            .populate('userId', 'username')
            .sort({ createdAt: -1 });

        const schoolYears = {};
        evaluations.forEach(evaluation => {
            if (!schoolYears[evaluation.schoolyear]) {
                schoolYears[evaluation.schoolyear] = { semesters: new Set() };
            }
            schoolYears[evaluation.schoolyear].semesters.add(evaluation.semester);
        });

        const result = Object.keys(schoolYears).map(schoolyear => ({
            schoolyear,
            semesters: Array.from(schoolYears[schoolyear].semesters),
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET SUBJECTS ───────────────────────────────────────────────────────────
router.get('/subjects/:instructorId/:schoolyear/:semester', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, semester } = req.params;

        const subjects = await Supervisor_Evaluation.find({
            instructorId,
            schoolyear,
            semester,
        }).distinct('title');

        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET EVALUATION DETAILS ─────────────────────────────────────────────────
router.get('/details/:instructorId/:schoolyear/:semester/:title', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, semester, title } = req.params;

        const evaluations = await Supervisor_Evaluation.find({
            instructorId,
            schoolyear,
            semester,
            title,
        })
            .populate('userId', 'username')
            .sort({ createdAt: -1 });

        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET SEMESTERS ──────────────────────────────────────────────────────────
router.get('/semesters/:instructorId/:schoolyear', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear } = req.params;

        const semesters = await Supervisor_Evaluation.find({
            instructorId,
            schoolyear,
        }).distinct('semester');

        res.json(semesters);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;