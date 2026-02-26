import express from 'express';
import Faculty_Evaluation from '../models/Faculty_Evaluation.js';
import StudentEvaluation from '../models/Student_Evaluation.js';
import protectRouteFaculty from '../middleware/faculty.middleware.js';

const router = express.Router();

// Get all school years that have evaluations for a faculty
router.get('/schoolyears/:facultyId', protectRouteFaculty, async (req, res) => {
    try {
        const { facultyId } = req.params;
        console.log('=== FETCHING SCHOOL YEARS FOR FACULTY ===');
        console.log('Faculty ID:', facultyId);

        // Get school years from Program Chair evaluations (Faculty_Evaluation)
        const programChairSchoolYears = await Faculty_Evaluation.distinct('schoolyear', { facultyId });
        
        // Get school years from Student evaluations (StudentEvaluation)
        const studentSchoolYears = await StudentEvaluation.distinct('schoolyear', { 
            evaluatorId: facultyId,
            evaluatorType: 'faculty'
        });

        console.log('Program Chair school years:', programChairSchoolYears);
        console.log('Student school years:', studentSchoolYears);

        // Combine and deduplicate school years
        const allSchoolYears = [...new Set([...programChairSchoolYears, ...studentSchoolYears])];
        
        // Get count of subjects for each school year
        const schoolYearCounts = await Promise.all(allSchoolYears.map(async (schoolyear) => {
            // Count subjects from program chair evaluations
            const programChairCount = await Faculty_Evaluation.distinct('title', { 
                facultyId, 
                schoolyear 
            });
            
            // Count subjects from student evaluations
            const studentCount = await StudentEvaluation.distinct('title', { 
                evaluatorId: facultyId,
                evaluatorType: 'faculty',
                schoolyear 
            });

            const uniqueSubjects = [...new Set([...programChairCount, ...studentCount])];

            return {
                schoolyear,
                count: uniqueSubjects.length
            };
        }));

        // Sort by school year (descending)
        schoolYearCounts.sort((a, b) => b.schoolyear.localeCompare(a.schoolyear));

        console.log('Final school years:', schoolYearCounts);
        res.json(schoolYearCounts);
    } catch (error) {
        console.error('Error fetching school years:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all subjects for a faculty in a specific school year
router.get('/subjects/:facultyId/:schoolyear', protectRouteFaculty, async (req, res) => {
    try {
        const { facultyId, schoolyear } = req.params;
        console.log('=== FETCHING SUBJECTS FOR FACULTY ===');
        console.log('Faculty ID:', facultyId);
        console.log('School Year:', schoolyear);

        // Get subjects from Program Chair evaluations
        const programChairSubjects = await Faculty_Evaluation.distinct('title', { 
            facultyId, 
            schoolyear 
        });
        
        // Get subjects from Student evaluations
        const studentSubjects = await StudentEvaluation.distinct('title', { 
            evaluatorId: facultyId,
            evaluatorType: 'faculty',
            schoolyear 
        });

        console.log('Program Chair subjects:', programChairSubjects);
        console.log('Student subjects:', studentSubjects);

        // Combine and deduplicate
        const allSubjects = [...new Set([...programChairSubjects, ...studentSubjects])];

        console.log('Final subjects:', allSubjects);
        res.json(allSubjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all evaluations for a faculty in a specific school year and subject
router.get('/results/:facultyId/:schoolyear/:subject', protectRouteFaculty, async (req, res) => {
    try {
        const { facultyId, schoolyear, subject } = req.params;
        console.log('=== FETCHING EVALUATIONS FOR FACULTY ===');
        console.log('Faculty ID:', facultyId);
        console.log('School Year:', schoolyear);
        console.log('Subject:', subject);

        // Get evaluations from Program Chairs
        const programChairEvaluations = await Faculty_Evaluation.find({ 
            facultyId, 
            schoolyear,
            title: subject
        }).populate('userId', 'username');

        // Get evaluations from Students
        const studentEvaluations = await StudentEvaluation.find({ 
            evaluatorId: facultyId,
            evaluatorType: 'faculty',
            schoolyear,
            title: subject
        }).populate('userId', 'username');

        console.log('Program Chair evaluations:', programChairEvaluations.length);
        console.log('Student evaluations:', studentEvaluations.length);

        // Combine and format evaluations
        const allEvaluations = [
            ...programChairEvaluations.map(e => ({
                _id: e._id,
                evaluatorName: e.userId?.username || 'Unknown Program Chair',
                semester: e.semester,
                department: e.department,
                points: e.points,
                type: 'programchair'
            })),
            ...studentEvaluations.map(e => ({
                _id: e._id,
                evaluatorName: e.name || 'Anonymous Student',
                semester: e.semester,
                department: e.department,
                points: e.points,
                type: 'student'
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