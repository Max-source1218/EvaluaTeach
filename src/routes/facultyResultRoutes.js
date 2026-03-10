import express from 'express';
import Faculty_Evaluation from '../models/Faculty_Evaluation.js';
import StudentEvaluation from '../models/Student_Evaluation.js';
import combinedAuth from '../middleware/combinedAuth.middleware.js';

const router = express.Router();

const studentFacultyFilter = (facultyId, extra = {}) => ({
    facultyId,            // ✅ faculty being evaluated
    evaluatorType: 'Student',
    ...extra,
});

// ─── SCHOOL YEARS ──────────────────────────────────────────────────────────
router.get('/schoolyears/:facultyId', combinedAuth, async (req, res) => {
    try {
        const { facultyId } = req.params;

        const [pcYears, studentYears] = await Promise.all([
            Faculty_Evaluation.distinct('schoolyear', { facultyId }),
            StudentEvaluation.distinct('schoolyear', studentFacultyFilter(facultyId)),
        ]);

        const allSchoolYears = [...new Set([...pcYears, ...studentYears])]
            .sort((a, b) => b.localeCompare(a));

        // ✅ Return plain string array — frontend just needs the year value
        // Removed N+1 subject-count queries — count is never displayed
        res.json(allSchoolYears);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── DEPARTMENTS ───────────────────────────────────────────────────────────
router.get('/departments/:facultyId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear } = req.params;

        const [pcDepts, studentDepts] = await Promise.all([
            Faculty_Evaluation.distinct('department', { facultyId, schoolyear }),
            StudentEvaluation.distinct('department', studentFacultyFilter(facultyId, { schoolyear })),
        ]);

        const allDepartments = [...new Set([...pcDepts, ...studentDepts])];
        res.json(allDepartments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── TABULATION SEMESTERS (no department filter) ───────────────────────────
router.get('/semesters/:facultyId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear } = req.params;

        const [pcSemesters, studentSemesters] = await Promise.all([
            Faculty_Evaluation.distinct('semester', { facultyId, schoolyear }),
            StudentEvaluation.distinct('semester', studentFacultyFilter(facultyId, { schoolyear })),
        ]);

        const allSemesters = [...new Set([...pcSemesters, ...studentSemesters])];
        res.json(allSemesters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── SEMESTERS ─────────────────────────────────────────────────────────────
router.get('/semesters/:facultyId/:schoolyear/:department', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, department } = req.params;

        const [pcSemesters, studentSemesters] = await Promise.all([
            Faculty_Evaluation.distinct('semester', { facultyId, schoolyear, department }),
            StudentEvaluation.distinct('semester', studentFacultyFilter(facultyId, { schoolyear, department })),
        ]);

        const allSemesters = [...new Set([...pcSemesters, ...studentSemesters])];
        res.json(allSemesters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── SUBJECTS ──────────────────────────────────────────────────────────────
router.get('/subjects/:facultyId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, department, semester } = req.params;

        const [pcSubjects, studentSubjects] = await Promise.all([
            Faculty_Evaluation.distinct('title', { facultyId, schoolyear, department, semester }),
            StudentEvaluation.distinct('title', studentFacultyFilter(facultyId, { schoolyear, department, semester })),
        ]);

        const allSubjects = [...new Set([...pcSubjects, ...studentSubjects])];
        res.json(allSubjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── RESULTS ───────────────────────────────────────────────────────────────
router.get('/results/:facultyId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, department, semester, subject } = req.params;

        const filter = { facultyId, schoolyear, department, semester, title: subject };

        const [pcEvaluations, studentEvaluations] = await Promise.all([
            Faculty_Evaluation.find(filter).populate('userId', 'username'),
            StudentEvaluation.find(
                studentFacultyFilter(facultyId, { schoolyear, department, semester, title: subject })
            ).populate('studentId', 'username'), // ✅ fixed from userId
        ]);

        const allEvaluations = [
            ...pcEvaluations.map(e => ({
                _id:           e._id,
                name:          e.name || e.userId?.username || 'Unknown',
                department:    e.department,
                points:        e.points,
                evaluatorType: 'Program Chair',
            })),
            ...studentEvaluations.map(e => ({
                _id:           e._id,
                name:          e.name || e.studentId?.username || 'Anonymous Student', // ✅ fixed
                department:    e.department,
                points:        e.points,
                evaluatorType: 'Student',
            })),
        ];

        res.json(allEvaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── DASHBOARD SUBJECTS ────────────────────────────────────────────────────
router.get('/dashboard/subjects/:facultyId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear } = req.params;

        const [pcSubjects, studentSubjects] = await Promise.all([
            Faculty_Evaluation.distinct('title', { facultyId, schoolyear }),
            StudentEvaluation.distinct('title', studentFacultyFilter(facultyId, { schoolyear })), // ✅ fixed evaluatorType
        ]);

        const allSubjects = [...new Set([...pcSubjects, ...studentSubjects])];
        res.json(allSubjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── DASHBOARD RESULTS ─────────────────────────────────────────────────────
router.get('/dashboard/results/:facultyId/:schoolyear/:subject', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, subject } = req.params;

        const [pcEvaluations, studentEvaluations] = await Promise.all([
            Faculty_Evaluation.find({ facultyId, schoolyear, title: subject })
                .populate('userId', 'username'),
            StudentEvaluation.find(
                studentFacultyFilter(facultyId, { schoolyear, title: subject })
            ).populate('studentId', 'username'), // ✅ fixed from userId
        ]);

        const allEvaluations = [
            ...pcEvaluations.map(e => ({
                _id:           e._id,
                name:          e.name || e.userId?.username || 'Unknown',
                department:    e.department,
                semester:      e.semester,
                points:        e.points,
                evaluatorType: 'Program Chair',
            })),
            ...studentEvaluations.map(e => ({
                _id:           e._id,
                name:          e.name || e.studentId?.username || 'Anonymous Student', // ✅ fixed
                department:    e.department,
                semester:      e.semester,
                points:        e.points,
                evaluatorType: 'Student',
            })),
        ];

        res.json(allEvaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── TABULATED ─────────────────────────────────────────────────────────────
router.get('/tabulated/:facultyId/:schoolyear', combinedAuth, async (req, res) => {
   try {
        const { facultyId, schoolyear } = req.params;

        const [pcEvaluations, studentEvaluations] = await Promise.all([
            Faculty_Evaluation.find({ facultyId, schoolyear }),
            // ✅ Fixed: was evaluatorType: 'faculty', now uses helper
            StudentEvaluation.find(studentFacultyFilter(facultyId, { schoolyear })),
        ]);

        const semesters = [...new Set([
            ...pcEvaluations.map(e => e.semester),
            ...studentEvaluations.map(e => e.semester),
        ])];

        const results = semesters.map(semester => {
            const semesterPC      = pcEvaluations.filter(e => e.semester === semester);
            const semesterStudent = studentEvaluations.filter(e => e.semester === semester);

            const studentCount  = semesterStudent.length;
            const studentRating = studentCount > 0
                ? semesterStudent.reduce((sum, e) => sum + e.points, 0) / studentCount
                : 0;
            const studentScore    = (studentRating * 100) / 5;
            const studentRating60 = studentRating * 0.6;
            const studentScore60  = studentScore * 0.6;

            const chairCount  = semesterPC.length;
            const chairRating = chairCount > 0
                ? semesterPC.reduce((sum, e) => sum + e.points, 0) / chairCount
                : 0;
            const chairScore    = (chairRating * 100) / 5;
            const chairRating40 = chairRating * 0.4;
            const chairScore40  = chairScore * 0.4;

            return {
                semester,
                student: {
                    rating: studentRating, score: studentScore,
                    rating60: studentRating60, score60: studentScore60,
                    count: studentCount,
                },
                chair: {
                    rating: chairRating, score: chairScore,
                    rating40: chairRating40, score40: chairScore40,
                    count: chairCount,
                },
                total: {
                    score:  studentScore60  + chairScore40,
                    rating: studentRating60 + chairRating40,
                },
            };
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;