// routes/programChairResultRoutes.js
import express from 'express';
import Supervisor_Evaluation from '../models/Supervisor_Evaluation.js';
import StudentEvaluation from '../models/Student_Evaluation.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all school years that have evaluations for a program chair
router.get('/schoolyears/:programChairId', protectRoute, async (req, res) => {
    try {
        const { programChairId } = req.params;
        console.log('=== FETCHING SCHOOL YEARS FOR PROGRAM CHAIR ===');
        console.log('Program Chair ID:', programChairId);

        // Get school years from Supervisor evaluations (Supervisor_Evaluation)
        // instructorId is the program chair being evaluated
        const supervisorSchoolYears = await Supervisor_Evaluation.distinct('schoolyear', { 
            instructorId: programChairId 
        });
        
        // Get school years from Student evaluations (StudentEvaluation)
        // evaluatorId is the program chair, evaluatorType should be 'programchair'
        const studentSchoolYears = await StudentEvaluation.distinct('schoolyear', { 
            evaluatorId: programChairId,
            evaluatorType: 'programchair'
        });

        console.log('Supervisor school years:', supervisorSchoolYears);
        console.log('Student school years:', studentSchoolYears);

        // Combine and deduplicate school years
        const allSchoolYears = [...new Set([...supervisorSchoolYears, ...studentSchoolYears])];
        
        // Get count of subjects/titles for each school year
        const schoolYearCounts = await Promise.all(allSchoolYears.map(async (schoolyear) => {
            // Count titles from supervisor evaluations
            const supervisorCount = await Supervisor_Evaluation.distinct('title', { 
                instructorId: programChairId, 
                schoolyear 
            });
            
            // Count titles from student evaluations
            const studentCount = await StudentEvaluation.distinct('title', { 
                evaluatorId: programChairId,
                evaluatorType: 'programchair',
                schoolyear 
            });

            const uniqueTitles = [...new Set([...supervisorCount, ...studentCount])];

            return {
                schoolyear,
                count: uniqueTitles.length
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

// Get all titles/subjects for a program chair in a specific school year
router.get('/titles/:programChairId/:schoolyear', protectRoute, async (req, res) => {
    try {
        const { programChairId, schoolyear } = req.params;
        console.log('=== FETCHING TITLES FOR PROGRAM CHAIR ===');
        console.log('Program Chair ID:', programChairId);
        console.log('School Year:', schoolyear);

        // Get titles from Supervisor evaluations
        const supervisorTitles = await Supervisor_Evaluation.distinct('title', { 
            instructorId: programChairId, 
            schoolyear 
        });
        
        // Get titles from Student evaluations
        const studentTitles = await StudentEvaluation.distinct('title', { 
            evaluatorId: programChairId,
            evaluatorType: 'programchair',
            schoolyear 
        });

        console.log('Supervisor titles:', supervisorTitles);
        console.log('Student titles:', studentTitles);

        // Combine and deduplicate
        const allTitles = [...new Set([...supervisorTitles, ...studentTitles])];

        console.log('Final titles:', allTitles);
        res.json(allTitles);
    } catch (error) {
        console.error('Error fetching titles:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all evaluations for a program chair in a specific school year and title
router.get('/results/:programChairId/:schoolyear/:title', protectRoute, async (req, res) => {
    try {
        const { programChairId, schoolyear, title } = req.params;
        console.log('=== FETCHING EVALUATIONS FOR PROGRAM CHAIR ===');
        console.log('Program Chair ID:', programChairId);
        console.log('School Year:', schoolyear);
        console.log('Title:', title);

        // Get evaluations from Supervisors
        const supervisorEvaluations = await Supervisor_Evaluation.find({ 
            instructorId: programChairId, 
            schoolyear,
            title: title
        }).populate('userId', 'username');

        // Get evaluations from Students
        const studentEvaluations = await StudentEvaluation.find({ 
            evaluatorId: programChairId,
            evaluatorType: 'programchair',
            schoolyear,
            title: title
        }).populate('userId', 'username');

        console.log('Supervisor evaluations:', supervisorEvaluations.length);
        console.log('Student evaluations:', studentEvaluations.length);

        // Combine and format evaluations
        const allEvaluations = [
            ...supervisorEvaluations.map(e => ({
                _id: e._id,
                evaluatorName: e.userId?.username || 'Unknown Supervisor',
                semester: e.semester,
                department: e.department,
                points: e.points,
                type: 'supervisor'
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