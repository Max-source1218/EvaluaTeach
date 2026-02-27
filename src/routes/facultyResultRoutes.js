import express from 'express';
import Faculty_Evaluation from '../models/Faculty_Evaluation.js';
import StudentEvaluation from '../models/Student_Evaluation.js';
import combinedAuth from '../middleware/combinedAuth.middleware.js';

const router = express.Router();

// Get all school years that have evaluations for a faculty
router.get('/schoolyears/:facultyId', combinedAuth, async (req, res) => {
    try {
        const { facultyId } = req.params;
        console.log('=== FETCHING SCHOOL YEARS FOR FACULTY ===');
        console.log('Requested faculty ID:', facultyId);
        console.log('Requesting user:', req.user._id);

        // Get school years from Program Chair evaluations
        const programChairSchoolYears = await Faculty_Evaluation.distinct('schoolyear', { facultyId });
        
        // Get school years from Student evaluations
        const studentSchoolYears = await StudentEvaluation.distinct('schoolyear', { 
            evaluatorId: facultyId,
            evaluatorType: 'faculty'
        });

        // Combine and deduplicate
        const allSchoolYears = [...new Set([...programChairSchoolYears, ...studentSchoolYears])];
        
        // Get count for each school year
        const schoolYearCounts = await Promise.all(allSchoolYears.map(async (schoolyear) => {
            const programChairCount = await Faculty_Evaluation.distinct('title', { facultyId, schoolyear });
            const studentCount = await StudentEvaluation.distinct('title', { 
                evaluatorId: facultyId,
                evaluatorType: 'faculty',
                schoolyear 
            });
            const uniqueSubjects = [...new Set([...programChairCount, ...studentCount])];
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

// Get departments that have evaluated a faculty (for a specific school year)
router.get('/departments/:facultyId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear } = req.params;
        console.log('=== FETCHING DEPARTMENTS ===');
        console.log('Faculty ID:', facultyId, 'School Year:', schoolyear);

        // Get departments from Program Chair evaluations
        const programChairDepts = await Faculty_Evaluation.distinct('department', { 
            facultyId, 
            schoolyear 
        });
        
        // Get departments from Student evaluations
        const studentDepts = await StudentEvaluation.distinct('department', { 
            evaluatorId: facultyId,
            evaluatorType: 'faculty',
            schoolyear 
        });

        // Combine and deduplicate
        const allDepartments = [...new Set([...programChairDepts, ...studentDepts])];

        console.log('Departments:', allDepartments);
        res.json(allDepartments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get semesters for a faculty in a specific school year and department
router.get('/semesters/:facultyId/:schoolyear/:department', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, department } = req.params;
        console.log('=== FETCHING SEMESTERS ===');
        console.log('Faculty ID:', facultyId, 'School Year:', schoolyear, 'Department:', department);

        // Get semesters from Program Chair evaluations
        const programChairSemesters = await Faculty_Evaluation.distinct('semester', { 
            facultyId, 
            schoolyear,
            department
        });
        
        // Get semesters from Student evaluations
        const studentSemesters = await StudentEvaluation.distinct('semester', { 
            evaluatorId: facultyId,
            evaluatorType: 'faculty',
            schoolyear,
            department
        });

        // Combine and deduplicate
        const allSemesters = [...new Set([...programChairSemesters, ...studentSemesters])];

        console.log('Semesters:', allSemesters);
        res.json(allSemesters);
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get subjects for a faculty in a specific school year, department, and semester
router.get('/subjects/:facultyId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, department, semester } = req.params;
        console.log('=== FETCHING SUBJECTS ===');
        console.log('Faculty ID:', facultyId);
        console.log('School Year:', schoolyear);
        console.log('Department:', department);
        console.log('Semester:', semester);

        // Get subjects from Program Chair evaluations
        const programChairSubjects = await Faculty_Evaluation.distinct('title', { 
            facultyId, 
            schoolyear,
            department,
            semester
        });
        
        // Get subjects from Student evaluations
        const studentSubjects = await StudentEvaluation.distinct('title', { 
            evaluatorId: facultyId,
            evaluatorType: 'faculty',
            schoolyear,
            department,
            semester
        });

        // Combine and deduplicate
        const allSubjects = [...new Set([...programChairSubjects, ...studentSubjects])];

        console.log('Subjects:', allSubjects);
        res.json(allSubjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all evaluation results for a faculty in a specific school year, department, semester, and subject
router.get('/results/:facultyId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
    try {
        const { facultyId, schoolyear, department, semester, subject } = req.params;
        console.log('=== FETCHING EVALUATION RESULTS ===');
        console.log('Faculty ID:', facultyId);
        console.log('School Year:', schoolyear);
        console.log('Department:', department);
        console.log('Semester:', semester);
        console.log('Subject:', subject);

        // Get evaluations from Program Chairs
        const programChairEvaluations = await Faculty_Evaluation.find({ 
            facultyId, 
            schoolyear,
            department,
            semester,
            title: subject
        }).populate('userId', 'username');

        // Get evaluations from Students
        const studentEvaluations = await StudentEvaluation.find({ 
            evaluatorId: facultyId,
            evaluatorType: 'faculty',
            schoolyear,
            department,
            semester,
            title: subject
        }).populate('userId', 'username');

        console.log('Program Chair evaluations:', programChairEvaluations.length);
        console.log('Student evaluations:', studentEvaluations.length);

        // Combine and format results
        const allEvaluations = [
            ...programChairEvaluations.map(e => ({
                _id: e._id,
                name: e.name || e.userId?.username || 'Unknown',
                department: e.department,
                points: e.points,
                evaluatorType: 'Program Chair'
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

export default router;