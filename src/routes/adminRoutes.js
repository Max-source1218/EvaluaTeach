import express from 'express';
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import SupervisorForm from "../models/SupervisorForm.js";
import Subject from "../models/Subject.js";
import Student_Evaluation from "../models/Student_Evaluation.js";
import Faculty_Evaluation from "../models/Faculty_Evaluation.js";
import protectRoute from "../middleware/auth.middleware.js";
import combinedAuth from '../middleware/combinedAuth.middleware.js';

const router = express.Router();

// ─────────────────────────────────────────────
// USER LISTING ROUTES
// ─────────────────────────────────────────────

// Get all Program Chairs (for Supervisors)
// ✅ Fixed N+1: fetch all SupervisorForms in one query, map in memory
router.get("/program-chairs", protectRoute, async (req, res) => {
    try {
        const programChairs = await User.find({ role: 'Program Chair' }).select('-password').lean();
        const userIds = programChairs.map(pc => pc._id);

        // One query instead of one per program chair
        const supervisorForms = await SupervisorForm.find({ user: { $in: userIds } })
            .sort({ createdAt: -1 })
            .lean();

        // Map userId → most recent department
        const deptMap = {};
        supervisorForms.forEach(form => {
            const uid = form.user.toString();
            if (!deptMap[uid]) deptMap[uid] = form.department;
        });

        const result = programChairs.map(pc => ({
            _id: pc._id,
            username: pc.username,
            email: pc.email,
            role: pc.role,
            profileImage: pc.profileImage,
            department: deptMap[pc._id.toString()] || 'N/A',
            createdAt: pc.createdAt,
        }));

        res.json(result);
    } catch (error) {
        console.error("Error fetching program chairs:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all Faculty (for Program Chairs)
router.get("/faculty", protectRoute, async (req, res) => {
    try {
        const faculty = await Faculty.find().select('-password').lean();
        const result = faculty.map(f => ({
            _id: f._id,
            username: f.username,
            email: f.email,
            role: 'Faculty',
            profileImage: f.profileImage,
            department: f.department || 'N/A',
            createdAt: f.createdAt,
        }));
        res.json(result);
    } catch (error) {
        console.error("Error fetching faculty:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// FACULTY EVALUATION RESULT ROUTES
// (Used by Program Chair to view faculty results)
// ─────────────────────────────────────────────

// Get school years for a faculty
router.get('/faculty-results/school-years/:facultyId', combinedAuth, async (req, res) => {
    try {
        const { facultyId } = req.params;

        const faculty = await Faculty.findById(facultyId).lean();
        if (!faculty)
            return res.status(404).json({ message: 'Faculty not found' });

        const subjects = await Subject.find({ faculty: facultyId }).select('schoolyear').lean();
        if (!subjects.length)
            return res.status(404).json({ message: 'No school years available' });

        const schoolYears = [...new Set(subjects.map(s => s.schoolyear).filter(Boolean))].sort();
        res.json(schoolYears);
    } catch (error) {
        console.error('Error fetching faculty school years:', error.message);
        res.status(500).json({ message: 'Failed to fetch school years' });
    }
});

// Get departments for a faculty in a school year
router.get('/faculty-results/departments/:facultyId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear } = req.params;

        const subjects = await Subject.find({ faculty: facultyId, schoolyear }).select('department').lean();
        const departments = [...new Set(subjects.map(s => s.department).filter(Boolean))].sort();
        res.json(departments);
    } catch (error) {
        console.error('Error fetching faculty departments:', error.message);
        res.status(500).json({ message: 'Failed to fetch departments' });
    }
});

// Get semesters for a faculty
router.get('/faculty-results/semesters/:facultyId/:schoolyear/:department', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, department } = req.params;

        const subjects = await Subject.find({ faculty: facultyId, schoolyear, department }).select('semester').lean();
        const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort();
        res.json(semesters);
    } catch (error) {
        console.error('Error fetching faculty semesters:', error.message);
        res.status(500).json({ message: 'Failed to fetch semesters' });
    }
});

// Get subjects for a faculty
router.get('/faculty-results/subjects/:facultyId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, department, semester } = req.params;

        const subjects = await Subject.find({ faculty: facultyId, schoolyear, department, semester }).select('title').lean();
        const titles = [...new Set(subjects.map(s => s.title).filter(Boolean))].sort();
        res.json(titles);
    } catch (error) {
        console.error('Error fetching faculty subjects:', error.message);
        res.status(500).json({ message: 'Failed to fetch subjects' });
    }
});

// Get evaluation results for a faculty
// ✅ Removed duplicate — keeping only one definition
router.get('/faculty-results/results/:facultyId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, department, semester, subject } = req.params;

        const [studentEvaluations, pcEvaluations] = await Promise.all([
            Student_Evaluation.find({ facultyId, schoolyear, department, semester, title: subject })
                .populate('studentId', 'username').lean(),
            Faculty_Evaluation.find({ facultyId, schoolyear, department, semester, title: subject })
                .populate('userId', 'username').lean(),
        ]);

        const allEvaluations = [
            ...studentEvaluations.map(e => ({
                _id: e._id,
                name: e.studentId?.username || 'Unknown Student',
                evaluatorType: 'Student',
                points: e.points,
                department: e.department,
                comments: e.comments || '',
            })),
            ...pcEvaluations.map(e => ({
                _id: e._id,
                name: e.userId?.username || 'Unknown Program Chair',
                evaluatorType: 'Program Chair',
                points: e.points,
                department: e.department,
                comments: e.comments || '',
            })),
        ].sort((a, b) => b.points - a.points);

        res.json(allEvaluations);
    } catch (error) {
        console.error('Error fetching faculty evaluation results:', error.message);
        res.status(500).json({ message: 'Failed to fetch evaluation results' });
    }
});

// ─────────────────────────────────────────────
// PROGRAM CHAIR EVALUATION RESULT ROUTES
// (Used by Supervisor to view program chair results)
// ─────────────────────────────────────────────

// Get school years for a program chair
router.get('/chair-results/school-years/:userId', combinedAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        const subjects = await Subject.find({ user: userId }).select('schoolyear').lean();
        if (!subjects.length)
            return res.status(404).json({ message: 'No school years available' });

        const schoolYears = [...new Set(subjects.map(s => s.schoolyear).filter(Boolean))].sort();
        res.json(schoolYears);
    } catch (error) {
        console.error('Error fetching chair school years:', error.message);
        res.status(500).json({ message: 'Failed to fetch school years' });
    }
});

// Get departments for a program chair
router.get('/chair-results/departments/:userId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { userId, schoolyear } = req.params;

        const subjects = await Subject.find({ user: userId, schoolyear }).select('department').lean();
        const departments = [...new Set(subjects.map(s => s.department).filter(Boolean))].sort();
        res.json(departments);
    } catch (error) {
        console.error('Error fetching chair departments:', error.message);
        res.status(500).json({ message: 'Failed to fetch departments' });
    }
});

// Get semesters for a program chair
router.get('/chair-results/semesters/:userId/:schoolyear/:department', combinedAuth, async (req, res) => {
    try {
        const { userId, schoolyear, department } = req.params;

        const subjects = await Subject.find({ user: userId, schoolyear, department }).select('semester').lean();
        const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort();
        res.json(semesters);
    } catch (error) {
        console.error('Error fetching chair semesters:', error.message);
        res.status(500).json({ message: 'Failed to fetch semesters' });
    }
});

// Get subjects for a program chair
router.get('/chair-results/subjects/:userId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
    try {
        const { userId, schoolyear, department, semester } = req.params;

        const subjects = await Subject.find({ user: userId, schoolyear, department, semester }).select('title').lean();
        const titles = [...new Set(subjects.map(s => s.title).filter(Boolean))].sort();
        res.json(titles);
    } catch (error) {
        console.error('Error fetching chair subjects:', error.message);
        res.status(500).json({ message: 'Failed to fetch subjects' });
    }
});

// ─────────────────────────────────────────────
// SUBJECTS OVERVIEW
// ─────────────────────────────────────────────

// Get all subjects with their assigned instructors
// ✅ Fixed N+1: replaced nested per-title queries with single populate query
router.get('/all-subjects', combinedAuth, async (req, res) => {
    try {
        const allSubjects = await Subject.find()
            .populate('faculty', 'username department')
            .populate('user', 'username role')
            .lean();

        if (!allSubjects.length) return res.json([]);

        // Group by title in memory — no extra DB queries
        const titleMap = {};
        allSubjects.forEach(subject => {
            const title = subject.title;
            if (!title) return;

            if (!titleMap[title]) titleMap[title] = { subject: title, creators: new Map() };

            if (subject.faculty?.username) {
                titleMap[title].creators.set(subject.faculty.username, {
                    name: subject.faculty.username,
                    role: 'Faculty',
                    department: subject.faculty.department || 'N/A',
                });
            }

            if (subject.user?.username) {
                titleMap[title].creators.set(subject.user.username, {
                    name: subject.user.username,
                    role: 'Program Chair',
                    department: subject.user.department || 'N/A',
                });
            }
        });

        const result = Object.values(titleMap)
            .map(entry => ({ subject: entry.subject, creators: Array.from(entry.creators.values()) }))
            .sort((a, b) => a.subject.localeCompare(b.subject));

        res.json(result);
    } catch (error) {
        console.error('Error fetching all subjects:', error.message);
        res.status(500).json({ message: 'Failed to fetch subjects' });
    }
});

export default router;