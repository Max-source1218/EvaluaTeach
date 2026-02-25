import express from 'express';
import Supervisor_evaluation from '../models/Supervisor_evaluation.js';
import Supervisor_Detail from '../models/SupervisorForm.js'; 
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protectRoute, async (req, res) => {
    try {
        const { title, semester, schoolyear, instructorId, userId, department, points } = req.body;

        // Fixed: points === undefined instead of points === )
        if (!title || !semester || !schoolyear || !instructorId || !userId || !department || points === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const supervisorDetail = await Supervisor_Detail.findOne({ user: userId });
        if (!supervisorDetail) {
            return res.status(404).json({ message: 'Supervisor details not found' });
        }

        const newEvaluation = new Supervisor_evaluation({
            title,
            semester,
            schoolyear,
            instructorId,
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

router.get('/instructor/:instructorId', protectRoute, async (req, res) => {
    try {
        const { instructorId } = req.params;
        const evaluations = await Supervisor_evaluation.find({ instructorId }).populate('instructorId', 'name department');

        const schoolYears = {};
        evaluations.forEach(evaluation => {
            if (!schoolYears[evaluation.schoolyear]) {
                schoolYears[evaluation.schoolyear] = { semesters: new Set() };
            }
            // Fixed: evaluation.semester instead of eval.semester
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

router.get('/subjects/:instructorId/:schoolyear/:semester', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, semester } = req.params;
        const evaluations = await Supervisor_evaluation.find({ instructorId, schoolyear, semester }).distinct('title');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/details/:instructorId/:schoolyear/:semester/:title', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, semester, title } = req.params;
        const evaluations = await Supervisor_evaluation.find({ instructorId, schoolyear, semester, title })
            .populate('userId', 'name');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/semesters/:instructorId/:schoolyear', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear } = req.params;
        const evaluations = await Supervisor_evaluation.find({ instructorId, schoolyear }).distinct('semester');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;