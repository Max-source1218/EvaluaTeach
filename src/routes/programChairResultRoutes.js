import express from 'express';
import Supervisor_Evaluation from '../models/Supervisor_evaluation.js';
import StudentEvaluation from '../models/Student_Evaluation.js';
import combinedAuth from '../middleware/combinedAuth.middleware.js';

const router = express.Router();

// Get all school years that have evaluations for a program chair
router.get('/schoolyears/:programChairId', combinedAuth, async (req, res) => {
    try {
        const { programChairId } = req.params;
        console.log('=== FETCHING SCHOOL YEARS FOR PROGRAM CHAIR ===');
        console.log('Program Chair ID:', programChairId);

        // Get school years from Supervisor evaluations
        const supervisorSchoolYears = await Supervisor_Evaluation.distinct('schoolyear', { 
            instructorId: programChairId 
        });
        
        // Get school years from Student evaluations (evaluatorType = 'programchair')
        const studentSchoolYears = await StudentEvaluation.distinct('schoolyear', { 
            evaluatorId: programChairId,
            evaluatorType: 'programchair'
        });

        // Combine and deduplicate
        const allSchoolYears = [...new Set([...supervisorSchoolYears, ...studentSchoolYears])];
        
        // Get count for each school year
        const schoolYearCounts = await Promise.all(allSchoolYears.map(async (schoolyear) => {
            const supervisorCount = await Supervisor_Evaluation.distinct('title', { 
                instructorId: programChairId, 
                schoolyear 
            });
            const studentCount = await StudentEvaluation.distinct('title', { 
                evaluatorId: programChairId,
                evaluatorType: 'programchair',
                schoolyear 
            });
            const uniqueSubjects = [...new Set([...supervisorCount, ...studentCount])];
            return { schoolyear, count: uniqueSubjects.length };
        }));

        // Sort descending
        schoolYearCounts.sort((a, b) => b.schoolyear.localeCompare(a.schoolyear));

        console.log('School years:', schoolYearCounts);
        res.json(schoolYearCounts);
    } catch (error) {
        console.error('Error fetching school years:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get departments that have evaluated a program chair
router.get('/departments/:programChairId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear } = req.params;
        console.log('=== FETCHING DEPARTMENTS ===');

        const supervisorDepts = await Supervisor_Evaluation.distinct('department', { 
            instructorId: programChairId, 
            schoolyear 
        });
        
        const studentDepts = await StudentEvaluation.distinct('department', { 
            evaluatorId: programChairId,
            evaluatorType: 'programchair',
            schoolyear 
        });

        const allDepartments = [...new Set([...supervisorDepts, ...studentDepts])];

        console.log('Departments:', allDepartments);
        res.json(allDepartments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get semesters for a program chair
router.get('/semesters/:programChairId/:schoolyear/:department', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear, department } = req.params;
        console.log('=== FETCHING SEMESTERS ===');

        const supervisorSemesters = await Supervisor_Evaluation.distinct('semester', { 
            instructorId: programChairId, 
            schoolyear,
            department
        });
        
        const studentSemesters = await StudentEvaluation.distinct('semester', { 
            evaluatorId: programChairId,
            evaluatorType: 'programchair',
            schoolyear,
            department
        });

        const allSemesters = [...new Set([...supervisorSemesters, ...studentSemesters])];

        console.log('Semesters:', allSemesters);
        res.json(allSemesters);
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get subjects for a program chair
router.get('/subjects/:programChairId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear, department, semester } = req.params;
        console.log('=== FETCHING SUBJECTS ===');

        const supervisorSubjects = await Supervisor_Evaluation.distinct('title', { 
            instructorId: programChairId, 
            schoolyear,
            department,
            semester
        });
        
        const studentSubjects = await StudentEvaluation.distinct('title', { 
            evaluatorId: programChairId,
            evaluatorType: 'programchair',
            schoolyear,
            department,
            semester
        });

        const allSubjects = [...new Set([...supervisorSubjects, ...studentSubjects])];

        console.log('Subjects:', allSubjects);
        res.json(allSubjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get evaluation results for a program chair
router.get('/results/:programChairId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear, department, semester, subject } = req.params;
        console.log('=== FETCHING EVALUATION RESULTS ===');

        // Get evaluations from Supervisors
        const supervisorEvaluations = await Supervisor_Evaluation.find({ 
            instructorId: programChairId, 
            schoolyear,
            department,
            semester,
            title: subject
        }).populate('userId', 'username');

        // Get evaluations from Students
        const studentEvaluations = await StudentEvaluation.find({ 
            evaluatorId: programChairId,
            evaluatorType: 'programchair',
            schoolyear,
            department,
            semester,
            title: subject
        }).populate('userId', 'username');

        console.log('Supervisor evaluations:', supervisorEvaluations.length);
        console.log('Student evaluations:', studentEvaluations.length);

        // Combine and format results
        const allEvaluations = [
            ...supervisorEvaluations.map(e => ({
                _id: e._id,
                name: e.name || e.userId?.username || 'Unknown',
                department: e.department,
                points: e.points,
                evaluatorType: 'Supervisor'
            })),
            ...studentEvaluations.map(e => ({
                _id: e._id,
                name: e.name || 'Anonymous Student',
                department: e.department,
                points: e.points,
                evaluatorType: 'Student'
            }))
        ];

        console.log('Total evaluations:', allEvaluations.length);
        res.json(allEvaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: error.message });
    }
});
// Get tabulated results for program chair (grouped by semester)
router.get('/tabulated/:programChairId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { programChairId, schoolyear } = req.params;
        console.log('=== FETCHING TABULATED RESULTS FOR PROGRAM CHAIR ===');
        console.log('Program Chair ID:', programChairId);
        console.log('School Year:', schoolyear);

        // Get ALL evaluations from Supervisors for this program chair
        const supervisorEvaluations = await Supervisor_Evaluation.find({ 
            instructorId: programChairId, 
            schoolyear
        });

        // Get ALL evaluations from Students for this program chair
        const studentEvaluations = await StudentEvaluation.find({ 
            evaluatorId: programChairId,
            evaluatorType: 'programchair',
            schoolyear
        });

        console.log('Supervisor evaluations:', supervisorEvaluations.length);
        console.log('Student evaluations:', studentEvaluations.length);

        // Get unique semesters
        const semesters = [...new Set([
            ...supervisorEvaluations.map(e => e.semester),
            ...studentEvaluations.map(e => e.semester)
        ])];

        // Calculate for each semester
        const results = semesters.map(semester => {
            // Filter by semester
            const semesterSupervisorEvals = supervisorEvaluations.filter(e => e.semester === semester);
            const semesterStudentEvals = studentEvaluations.filter(e => e.semester === semester);

            // Student Calculations (60% weight)
            const studentSum = semesterStudentEvals.reduce((sum, e) => sum + e.points, 0);
            const studentCount = semesterStudentEvals.length;
            const studentRating = studentCount > 0 ? studentSum / studentCount : 0;
            const studentScore = (studentRating * 100) / 5;
            const studentRating60 = studentRating * 0.6;
            const studentScore60 = studentScore * 0.6;

            // Supervisor Calculations (40% weight)
            const supervisorSum = semesterSupervisorEvals.reduce((sum, e) => sum + e.points, 0);
            const supervisorCount = semesterSupervisorEvals.length;
            const supervisorRating = supervisorCount > 0 ? supervisorSum / supervisorCount : 0;
            const supervisorScore = (supervisorRating * 100) / 5;
            const supervisorRating40 = supervisorRating * 0.4;
            const supervisorScore40 = supervisorScore * 0.4;

            // Final Calculations
            const totalScore = studentScore60 + supervisorScore40;
            const totalRating = studentRating60 + supervisorRating40;

            return {
                semester,
                student: {
                    rating: studentRating,
                    score: studentScore,
                    rating60: studentRating60,
                    score60: studentScore60,
                    count: studentCount
                },
                supervisor: {
                    rating: supervisorRating,
                    score: supervisorScore,
                    rating40: supervisorRating40,
                    score40: supervisorScore40,
                    count: supervisorCount
                },
                total: {
                    score: totalScore,
                    rating: totalRating
                }
            };
        });

        console.log('Tabulated results:', results);
        res.json(results);
    } catch (error) {
        console.error('Error fetching tabulated results:', error);
        res.status(500).json({ message: error.message });
    }
});
export default router;