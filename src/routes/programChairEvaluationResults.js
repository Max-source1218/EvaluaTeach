// routes/programChairEvaluationResults.js
import express from 'express';
import Supervisor_Evaluation from '../models/Supervisor_evaluation.js';
import Student_ProgramChair_Evaluation from '../models/Student_ProgramChair_Evaluation.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all school years for a program chair
router.get('/schoolyears/:instructorId', protectRoute, async (req, res) => {
    try {
        const { instructorId } = req.params;

        // Get school years from Supervisor evaluations and Student evaluations
        const [supervisorEvals, studentEvals] = await Promise.all([
            Supervisor_Evaluation.find({ instructorId }).distinct('schoolyear'),
            Student_ProgramChair_Evaluation.find({ instructorId }).distinct('schoolyear'),
        ]);

        const allSchoolYears = [...new Set([...supervisorEvals, ...studentEvals])];

        const schoolYearsWithCount = await Promise.all(
            allSchoolYears.map(async (schoolyear) => {
                const [supervisorSubjects, studentSubjects] = await Promise.all([
                    Supervisor_Evaluation.find({ instructorId, schoolyear }).distinct('title'),
                    Student_ProgramChair_Evaluation.find({ instructorId, schoolyear }).distinct('title'),
                ]);
                
                const allSubjects = [...new Set([...supervisorSubjects, ...studentSubjects])];
                
                return {
                    schoolyear,
                    count: allSubjects.length,
                };
            })
        );

        res.json(schoolYearsWithCount);
    } catch (error) {
        console.error('Error fetching school years:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all subjects for a program chair in a specific school year
router.get('/subjects/:instructorId/:schoolyear', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear } = req.params;

        const [supervisorSubjects, studentSubjects] = await Promise.all([
            Supervisor_Evaluation.find({ instructorId, schoolyear }).distinct('title'),
            Student_ProgramChair_Evaluation.find({ instructorId, schoolyear }).distinct('title'),
        ]);

        const allSubjects = [...new Set([...supervisorSubjects, ...studentSubjects])];
        res.json(allSubjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all evaluation results for a program chair on a specific subject
router.get('/results/:instructorId/:schoolyear/:subject', protectRoute, async (req, res) => {
    try {
        const { instructorId, schoolyear, subject } = req.params;

        const [supervisorEvals, studentEvals] = await Promise.all([
            Supervisor_Evaluation.find({ instructorId, schoolyear, title: subject }),
            Student_ProgramChair_Evaluation.find({ instructorId, schoolyear, title: subject }),
        ]);

        const allEvaluations = [
            ...supervisorEvals.map(e => ({
                _id: e._id,
                evaluatorName: e.name,
                points: e.points,
                semester: e.semester,
                department: e.department,
                createdAt: e.createdAt,
                evaluatorType: 'Supervisor',
            })),
            ...studentEvals.map(e => ({
                _id: e._id,
                evaluatorName: e.name,
                points: e.points,
                semester: e.semester,
                department: e.department,
                createdAt: e.createdAt,
                evaluatorType: 'Student',
            })),
        ];

        allEvaluations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(allEvaluations);
    } catch (error) {
        console.error('Error fetching evaluation results:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;