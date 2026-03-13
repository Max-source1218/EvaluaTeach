import express from 'express';
import Student_Detail from '../models/StudentForm.js';
import StudentEvaluation from '../models/Student_Evaluation.js';
import protectRouteStudent from '../middleware/student.middleware.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// ─── SUBMIT STUDENT EVALUATION ─────────────────────────────────────────────
router.post('/', protectRouteStudent, async (req, res) => {
    try {
        const {
            title,
            semester,
            schoolyear,
            evaluatorId,
            department,
            points,
        } = req.body;

        // ✅ Use authenticated user's _id — never trust client-sent studentId
        const studentId = req.user._id;

        if (!title || !semester || !schoolyear || !evaluatorId || !department) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // ✅ Proper points validation — 0 is falsy but valid
        if (points === undefined || points === null) {
            return res.status(400).json({ message: 'Points are required' });
        }

        // ✅ Verify student has filled out their detail form
        const studentDetail = await Student_Detail.findOne({ user: studentId });
        if (!studentDetail) {
            return res.status(404).json({ message: 'Student details not found. Please complete your profile first.' });
        }

        // ✅ Prevent duplicate evaluations — one per student per evaluator per subject per semester
        const existing = await StudentEvaluation.findOne({
            studentId,
            evaluatorId,
            title,
            semester,
            schoolyear,
        });
        if (existing) {
            return res.status(409).json({
                message: 'You have already submitted an evaluation for this subject this semester.'
            });
        }

        const newEvaluation = new StudentEvaluation({
            title,
            semester,
            schoolyear,
            evaluatorId,
            evaluatorType: 'Student', // ✅ Always set server-side — never trust client
            studentId,
            department,
            points,
        });

        await newEvaluation.save();
        res.status(201).json({ message: 'Evaluation submitted successfully', evaluation: newEvaluation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET EVALUATIONS BY INSTRUCTOR ─────────────────────────────────────────
router.get('/instructor/:instructorId', protectRoute, async (req, res) => {
    try {
        const { instructorId } = req.params;

        const evaluations = await StudentEvaluation.find({ evaluatorId: instructorId })
            .populate('evaluatorId', 'username department');

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

// ─── GET DISTINCT SUBJECTS ──────────────────────────────────────────────────
router.get('/subjects/:instructorId/:schoolyear/:semester', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, semester } = req.params;

        const subjects = await StudentEvaluation.find({
            evaluatorId: instructorId,
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

        const evaluations = await StudentEvaluation.find({
            evaluatorId: instructorId,
            schoolyear,
            semester,
            title,
        }).populate('studentId', 'username');

        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET DISTINCT SEMESTERS ─────────────────────────────────────────────────
router.get('/semesters/:instructorId/:schoolyear', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear } = req.params;

        const semesters = await StudentEvaluation.find({
            evaluatorId: instructorId,
            schoolyear,
        }).distinct('semester');

        res.json(semesters);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;