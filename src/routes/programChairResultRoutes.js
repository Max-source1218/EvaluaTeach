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

export default router;