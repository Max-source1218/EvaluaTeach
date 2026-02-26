import express from 'express';
import Supervisor_Evaluation from '../models/Supervisor_evaluation.js';
import SupervisorForm from '../models/SupervisorForm.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// Create new evaluation
router.post('/', protectRoute, async (req, res) => {
    try {
        const { title, semester, schoolyear, instructorId, userId, department, points, name } = req.body;

        console.log('=== POST /supervisor-evaluation ===');
        console.log('req.body:', req.body);

        if (!title || !semester || !schoolyear || !instructorId || !userId || !department || points === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newEvaluation = new Supervisor_Evaluation({
            title,
            semester,
            schoolyear,
            instructorId,
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

// Get evaluations for a specific instructor (Program Chair)
router.get('/instructor/:instructorId', protectRoute, async (req, res) => {
    try {
        const { instructorId } = req.params;
        const evaluations = await Supervisor_Evaluation.find({ instructorId })
            .populate('instructorId', 'username department')
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

// Get subjects for an instructor in specific semester/year
router.get('/subjects/:instructorId/:schoolyear/:semester', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, semester } = req.params;
        const evaluations = await Supervisor_Evaluation.find({ 
            instructorId, 
            schoolyear, 
            semester 
        }).distinct('title');
        
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get evaluation details
router.get('/details/:instructorId/:schoolyear/:semester/:title', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, semester, title } = req.params;
        const evaluations = await Supervisor_Evaluation.find({ 
            instructorId, 
            schoolyear, 
            semester, 
            title 
        })
        .populate('userId', 'username')
        .sort({ createdAt: -1 });
        
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get semesters for a schoolyear
router.get('/semesters/:instructorId/:schoolyear', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear } = req.params;
        const evaluations = await Supervisor_Evaluation.find({ 
            instructorId, 
            schoolyear 
        }).distinct('semester');
        
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;