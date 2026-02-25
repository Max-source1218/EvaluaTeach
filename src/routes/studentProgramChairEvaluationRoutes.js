// routes/studentProgramChairEvaluationRoutes.js
import express from 'express';
import Student_ProgramChair_Evaluation from '../models/Student_ProgramChair_Evaluation.js';
import Student_Detail from '../models/StudentForm.js';
import protectRouteStudent from '../middleware/student.middleware.js';

const router = express.Router();

router.post('/', protectRouteStudent, async (req, res) => {
    try {
        const { title, semester, schoolyear, instructorId, department, points } = req.body;
        const userId = req.user._id;

        if (!title || !semester || !schoolyear || !instructorId || !department || points === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Get student name from Student_Detail
        const studentDetail = await Student_Detail.findOne({ user: userId });
        if (!studentDetail) {
            return res.status(404).json({ message: 'Student details not found' });
        }

        const newEvaluation = new Student_ProgramChair_Evaluation({
            title,
            semester,
            schoolyear,
            instructorId,
            userId,
            department,
            name: studentDetail.name,
            points,
        });

        await newEvaluation.save();
        res.status(201).json({ message: 'Evaluation submitted successfully', evaluation: newEvaluation });
    } catch (error) {
        console.error('Error creating evaluation:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get evaluations for a specific program chair
router.get('/programchair/:instructorId', protectRouteStudent, async (req, res) => {
    try {
        const { instructorId } = req.params;
        const evaluations = await Student_ProgramChair_Evaluation.find({ instructorId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get school years for a program chair
router.get('/programchair/:instructorId/schoolyears', protectRouteStudent, async (req, res) => {
    try {
        const { instructorId } = req.params;
        const schoolYears = await Student_ProgramChair_Evaluation.find({ instructorId }).distinct('schoolyear');
        res.json(schoolYears);
    } catch (error) {
        console.error('Error fetching school years:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get subjects for a program chair in a specific school year
router.get('/programchair/:instructorId/:schoolyear/subjects', protectRouteStudent, async (req, res) => {
    try {
        const { instructorId, schoolyear } = req.params;
        const subjects = await Student_ProgramChair_Evaluation.find({ instructorId, schoolyear }).distinct('title');
        res.json(subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get results for a program chair on a specific subject
router.get('/programchair/:instructorId/:schoolyear/:subject/results', protectRouteStudent, async (req, res) => {
    try {
        const { instructorId, schoolyear, subject } = req.params;
        const evaluations = await Student_ProgramChair_Evaluation.find({ instructorId, schoolyear, title: subject })
            .populate('userId', 'name');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;