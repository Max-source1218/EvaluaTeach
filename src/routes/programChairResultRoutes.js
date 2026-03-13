import express from 'express';
import Supervisor_Evaluation from '../models/Supervisor_evaluation.js';
import StudentEvaluation from '../models/Student_Evaluation.js';
import combinedAuth from '../middleware/combinedAuth.middleware.js';

const router = express.Router();

// ─── HELPER ────────────────────────────────────────────────────────────────
// Students evaluating program chairs have evaluatorType: 'Student' and
// evaluatorId pointing to the program chair's _id.
const studentPCFilter = (programChairId, extra = {}) => ({
    evaluatorId:   programChairId,
    evaluatorType: 'Student', // ✅ consistent with model enum
    ...extra,
});

// ─── SCHOOL YEARS ──────────────────────────────────────────────────────────
// Returns [{ schoolyear, count }] — frontend ChairSchoolYear expects objects
router.get('/schoolyears/:programChairId', combinedAuth, async (req, res) => {
    try {
        const { programChairId } = req.params;

        const [supervisorYears, studentYears] = await Promise.all([
            Supervisor_Evaluation.distinct('schoolyear', { instructorId: programChairId }),
            StudentEvaluation.distinct('schoolyear', studentPCFilter(programChairId)),
        ]);

        const allSchoolYears = [...new Set([...supervisorYears, ...studentYears])]
            .sort((a, b) => b.localeCompare(a));

        // ✅ Removed N+1 subject-count queries
        // ✅ Still returns objects to match ChairSchoolYear.jsx expectation
        const schoolYearCounts = allSchoolYears.map(schoolyear => ({
            schoolyear,
        }));

        res.json(schoolYearCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── DEPARTMENTS ───────────────────────────────────────────────────────────
router.get('/departments/:programChairId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear } = req.params;

        const [supervisorDepts, studentDepts] = await Promise.all([
            Supervisor_Evaluation.distinct('department', { instructorId: programChairId, schoolyear }),
            StudentEvaluation.distinct('department', studentPCFilter(programChairId, { schoolyear })),
        ]);

        const allDepartments = [...new Set([...supervisorDepts, ...studentDepts])];
        res.json(allDepartments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ─── SEMESTERS ─────────────────────────────────────────────────────────────

router.get('/semesters/:programChairId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear } = req.params;

        const [supervisorSemesters, studentSemesters] = await Promise.all([
            Supervisor_Evaluation.distinct('semester', { instructorId: programChairId, schoolyear }),
            StudentEvaluation.distinct('semester', studentPCFilter(programChairId, { schoolyear })),
        ]);

        const allSemesters = [...new Set([...supervisorSemesters, ...studentSemesters])];
        res.json(allSemesters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/semesters/:programChairId/:schoolyear/:department', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear, department } = req.params;

        const [supervisorSemesters, studentSemesters] = await Promise.all([
            Supervisor_Evaluation.distinct('semester', { instructorId: programChairId, schoolyear, department }),
            StudentEvaluation.distinct('semester', studentPCFilter(programChairId, { schoolyear, department })),
        ]);

        const allSemesters = [...new Set([...supervisorSemesters, ...studentSemesters])];
        res.json(allSemesters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── SUBJECTS ──────────────────────────────────────────────────────────────
router.get('/subjects/:programChairId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear, department, semester } = req.params;

        const [supervisorSubjects, studentSubjects] = await Promise.all([
            Supervisor_Evaluation.distinct('title', { instructorId: programChairId, schoolyear, department, semester }),
            StudentEvaluation.distinct('title', studentPCFilter(programChairId, { schoolyear, department, semester })),
        ]);

        const allSubjects = [...new Set([...supervisorSubjects, ...studentSubjects])];
        res.json(allSubjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── RESULTS ───────────────────────────────────────────────────────────────
router.get('/results/:programChairId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear, department, semester, subject } = req.params;

        const [supervisorEvaluations, studentEvaluations] = await Promise.all([
            Supervisor_Evaluation.find({
                instructorId: programChairId, schoolyear, department, semester, title: subject,
            }).populate('userId', 'username'),
            StudentEvaluation.find(
                studentPCFilter(programChairId, { schoolyear, department, semester, title: subject })
            ).populate('studentId', 'username'), // ✅ fixed from userId
        ]);

        const allEvaluations = [
            ...supervisorEvaluations.map(e => ({
                _id:           e._id,
                name:          e.name || e.userId?.username || 'Unknown',
                department:    e.department,
                points:        e.points,
                evaluatorType: 'Supervisor',
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

// ─── TABULATED ─────────────────────────────────────────────────────────────
router.get('/tabulated/:programChairId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear } = req.params;

        const [supervisorEvaluations, studentEvaluations] = await Promise.all([
            Supervisor_Evaluation.find({ instructorId: programChairId, schoolyear }),
            StudentEvaluation.find(studentPCFilter(programChairId, { schoolyear })),
        ]);

        const semesters = [...new Set([
            ...supervisorEvaluations.map(e => e.semester),
            ...studentEvaluations.map(e => e.semester),
        ])];

        const results = semesters.map(semester => {
            const semesterSupervisor = supervisorEvaluations.filter(e => e.semester === semester);
            const semesterStudent    = studentEvaluations.filter(e => e.semester === semester);

            const studentCount  = semesterStudent.length;
            const studentRating = studentCount > 0
                ? semesterStudent.reduce((sum, e) => sum + e.points, 0) / studentCount
                : 0;
            const studentScore    = (studentRating * 100) / 5;
            const studentRating60 = studentRating * 0.6;
            const studentScore60  = studentScore * 0.6;

            const supervisorCount  = semesterSupervisor.length;
            const supervisorRating = supervisorCount > 0
                ? semesterSupervisor.reduce((sum, e) => sum + e.points, 0) / supervisorCount
                : 0;
            const supervisorScore    = (supervisorRating * 100) / 5;
            const supervisorRating40 = supervisorRating * 0.4;
            const supervisorScore40  = supervisorScore * 0.4;

            return {
                semester,
                student: {
                    rating: studentRating, score: studentScore,
                    rating60: studentRating60, score60: studentScore60,
                    count: studentCount,
                },
                supervisor: {
                    rating: supervisorRating, score: supervisorScore,
                    rating40: supervisorRating40, score40: supervisorScore40,
                    count: supervisorCount,
                },
                total: {
                    score:  studentScore60  + supervisorScore40,
                    rating: studentRating60 + supervisorRating40,
                },
            };
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;