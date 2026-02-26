import express from 'express';
import Faculty_Evaluation from '../models/Faculty_Evaluation.js';
import Student_Faculty_Evaluation from '../models/Student_Evaluation.js';
import protectRouteFaculty from '../middleware/faculty.middleware.js';

const router = express.Router();

// Get all school years for a faculty
router.get('/schoolyears/:facultyId', protectRouteFaculty, async (req, res) => {
    try {
        const { facultyId } = req.params;

        // Get school years from Program Chair evaluations and Student evaluations
        const [programChairEvals, studentEvals] = await Promise.all([
            Faculty_Evaluation.find({ facultyId }).distinct('schoolyear'),
            Student_Faculty_Evaluation.find({ facultyId }).distinct('schoolyear'),
        ]);

        const allSchoolYears = [...new Set([...programChairEvals, ...studentEvals])];

        const schoolYearsWithCount = await Promise.all(
            allSchoolYears.map(async (schoolyear) => {
                const [programChairSubjects, studentSubjects] = await Promise.all([
                    Faculty_Evaluation.find({ facultyId, schoolyear }).distinct('title'),
                    Student_Faculty_Evaluation.find({ facultyId, schoolyear }).distinct('title'),
                ]);
                
                const allSubjects = [...new Set([...programChairSubjects, ...studentSubjects])];
                
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

// Get all subjects for a faculty in a specific school year
router.get('/subjects/:facultyId/:schoolyear', protectRouteFaculty, async (req, res) => {
     try {
        const { facultyId, schoolyear } = req.params;

        const [programChairSubjects, studentSubjects] = await Promise.all([
            Faculty_Evaluation.find({ facultyId, schoolyear }).distinct('title'),
            Student_Faculty_Evaluation.find({ facultyId, schoolyear }).distinct('title'),
        ]);

        const allSubjects = [...new Set([...programChairSubjects, ...studentSubjects])];
        res.json(allSubjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all evaluation results for a faculty on a specific subject
router.get('/results/:facultyId/:schoolyear/:subject', protectRouteFaculty, async (req, res) => {
    try {
        const { facultyId, schoolyear, subject } = req.params;

        const [programChairEvals, studentEvals] = await Promise.all([
            Faculty_Evaluation.find({ facultyId, schoolyear, title: subject }),
            Student_Faculty_Evaluation.find({ facultyId, schoolyear, title: subject }),
        ]);

        const allEvaluations = [
            ...programChairEvals.map(e => ({
                _id: e._id,
                evaluatorName: e.name,
                points: e.points,
                semester: e.semester,
                department: e.department,
                createdAt: e.createdAt,
                evaluatorType: 'Program Chair',
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