import express from 'express';
import Evaluation from '../models/Evaluation.js';
import protectRouteStudent from '../middleware/student.middleware.js'; 
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protectRouteStudent, async (req, res) => {
    try {
        const { title, semester, schoolyear, instructorId, userId, department, name, points } = req.body;

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
            name,
            points,
        });

        await newEvaluation.save();
        res.status(201).json({ message: 'Evaluation submitted successfully', evaluation: newEvaluation });
    } catch (error) {
        console.error('Error creating evaluation:', error);
        res.status(500).json({ message: error.message });
    }
});
router.get('/instructor/:instructorId', protectRoute, async (req, res) => {
    try {
        const { instructorId } = req.params;
        const evaluations = await Evaluation.find({ instructorId }).populate('instructorId', 'name department');

        // Group by schoolyear
        const schoolYears = {};
        evaluations.forEach(evaluation => {
            if (!schoolYears[evaluation.schoolyear]) {
                schoolYears[evaluation.schoolyear] = { semesters: new Set() };
            }
            schoolYears[evaluation.schoolyear].semesters.add(eval.semester);
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

router.get('/subjects/:instructorId/:schoolyear/:semester', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, semester } = req.params;
        const evaluations = await Evaluation.find({ instructorId, schoolyear, semester }).distinct('title');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/details/:instructorId/:schoolyear/:semester/:title', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, semester, title } = req.params;
        const evaluations = await Evaluation.find({ instructorId, schoolyear, semester, title })
            .populate('userId', 'name'); // Populate name from User
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/semesters/:instructorId/:schoolyear', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear } = req.params;
        const evaluations = await Evaluation.find({ instructorId, schoolyear }).distinct('semester');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;