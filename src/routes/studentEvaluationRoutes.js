import express from 'express';
import StudentEvaluation from '../models/Student_Evaluation.js';
import Student_Detail from '../models/StudentForm.js';
import protectRouteStudent from '../middleware/student.middleware.js';

const router = express.Router();

// Create new evaluation
router.post('/', protectRouteStudent, async (req, res) => {
    try {
        const { title, semester, schoolyear, evaluatorId, evaluatorType, userId, department, points, name } = req.body;

        console.log('=== POST /student-evaluation ===');
        console.log('req.body:', req.body);

        // Validation
        if (!title || !semester || !schoolyear || !evaluatorId || !evaluatorType || !userId || !department || points === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate evaluatorType
        if (!['faculty', 'programchair'].includes(evaluatorType)) {
            return res.status(400).json({ message: 'Invalid evaluator type' });
        }

        // Create new evaluation
        const newEvaluation = new StudentEvaluation({
            title,
            semester,
            schoolyear,
            evaluatorId,
            evaluatorType,
            userId,
            department,
            name: name || 'Unknown',
            points,
        });

        await newEvaluation.save();
        console.log('Evaluation saved:', newEvaluation._id);

        res.status(201).json({ message: 'Evaluation submitted successfully', evaluation: newEvaluation });
    } catch (error) {
        console.error('Error creating evaluation:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get evaluations for a specific evaluator (Faculty or Program Chair)
router.get('/evaluator/:evaluatorId', protectRouteStudent, async (req, res) => {
    try {
        const { evaluatorId } = req.params;
        const { evaluatorType } = req.query;

        console.log('=== GET /student-evaluation/evaluator/:evaluatorId ===');
        console.log('evaluatorId:', evaluatorId);
        console.log('evaluatorType:', evaluatorType);

        const query = { evaluatorId };
        if (evaluatorType) {
            query.evaluatorType = evaluatorType;
        }

        const evaluations = await StudentEvaluation.find(query)
            .populate('userId', 'username')
            .sort({ createdAt: -1 });

        // Group by schoolyear and semester
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
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get subjects for an evaluator in specific semester/year
router.get('/subjects/:evaluatorId/:schoolyear/:semester', protectRouteStudent, async (req, res) => {
    try {
        const { evaluatorId, schoolyear, semester } = req.params;
        const { evaluatorType } = req.query;

        const query = { evaluatorId, schoolyear, semester };
        if (evaluatorType) {
            query.evaluatorType = evaluatorType;
        }

        const evaluations = await StudentEvaluation.find(query).distinct('title');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get evaluation details
router.get('/details/:evaluatorId/:schoolyear/:semester/:title', protectRouteStudent, async (req, res) => {
    try {
        const { evaluatorId, schoolyear, semester, title } = req.params;
        const { evaluatorType } = req.query;

        const query = { evaluatorId, schoolyear, semester, title };
        if (evaluatorType) {
            query.evaluatorType = evaluatorType;
        }

        const evaluations = await StudentEvaluation.find(query)
            .populate('userId', 'username')
            .sort({ createdAt: -1 });

        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get semesters for a schoolyear
router.get('/semesters/:evaluatorId/:schoolyear', protectRouteStudent, async (req, res) => {
    try {
        const { evaluatorId, schoolyear } = req.params;
        const { evaluatorType } = req.query;

        const query = { evaluatorId, schoolyear };
        if (evaluatorType) {
            query.evaluatorType = evaluatorType;
        }

        const evaluations = await StudentEvaluation.find(query).distinct('semester');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all evaluations by current student
router.get('/my-evaluations', protectRouteStudent, async (req, res) => {
    try {
        const userId = req.user._id;
        const evaluations = await StudentEvaluation.find({ userId })
            .sort({ createdAt: -1 });
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;