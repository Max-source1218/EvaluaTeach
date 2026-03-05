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

// ============================================
// EXISTING ROUTES (Kept as-is)
// ============================================

// Get all Program Chairs (for Supervisors)
router.get("/program-chairs", protectRoute, async (req, res) => {
    try {
        const programChairs = await User.find({ role: 'Program Chair' }).select('-password');
        
        const programChairsWithDepartment = await Promise.all(
            programChairs.map(async (pc) => {
                const supervisorForm = await SupervisorForm.findOne({ user: pc._id })
                    .sort({ createdAt: -1 });
                
                return {
                    _id: pc._id,
                    username: pc.username,
                    email: pc.email,
                    role: pc.role,
                    profileImage: pc.profileImage,
                    department: supervisorForm?.department || 'N/A',
                    createdAt: pc.createdAt,
                };
            })
        );
        
        res.json(programChairsWithDepartment);
    } catch (error) {
        console.log("Error fetching program chairs:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all Faculty (for Program Chairs)
router.get("/faculty", protectRoute, async (req, res) => {
    try {
        const faculty = await Faculty.find().select('-password');
        
        const facultyWithDepartment = faculty.map(f => ({
            _id: f._id,
            username: f.username,
            email: f.email,
            role: 'Faculty',
            profileImage: f.profileImage,
            department: f.department || 'N/A',
            createdAt: f.createdAt,
        }));
        
        res.json(facultyWithDepartment);
    } catch (error) {
        console.log("Error fetching faculty:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// DEBUG: Check Faculty model - SHOWS EVERYTHING
router.get('/debug-faculty', combinedAuth, async (req, res) => {
    try {
        const allFaculty = await Faculty.find().lean();
        
        if (!allFaculty || allFaculty.length === 0) {
            return res.json({ 
                message: "No faculty found in database",
                totalFaculty: 0 
            });
        }
        
        // Show first faculty with ALL data
        const firstFaculty = allFaculty[0];
        
        res.json({
            totalFaculty: allFaculty.length,
            firstFacultyFields: Object.keys(firstFaculty),
            firstFacultyData: firstFaculty,
            allFacultyUsernames: allFaculty.map(f => f.username)
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all subjects - IMPROVED
router.get('/all-subjects', combinedAuth, async (req, res) => {
    try {
        console.log('=== FETCHING ALL SUBJECTS ===');
        
        // Import Subject model
        const Subject = (await import('../models/Subject.js')).default;
        const Faculty = (await import('../models/Faculty.js')).default;
        
        // Get all subjects
        const allSubjects = await Subject.find().lean();
        console.log('Total subjects in DB:', allSubjects.length);
        
        if (allSubjects.length === 0) {
            return res.json([]);
        }
        
        // Get unique subject titles
        const uniqueTitles = [...new Set(allSubjects.map(s => s.title).filter(Boolean))];
        console.log('Unique titles:', uniqueTitles);
        
        // For each subject, find creators
        const subjectsWithCreators = await Promise.all(uniqueTitles.map(async (title) => {
            // Find all Subject records with this title
            const subjectRecords = await Subject.find({ title }).lean();
            
            // Collect unique creators
            const creatorsMap = new Map();
            
            for (const record of subjectRecords) {
                // Check if faculty reference exists
                if (record.faculty) {
                    const faculty = await Faculty.findById(record.faculty).select('username').lean();
                    if (faculty?.username) {
                        creatorsMap.set(faculty.username, { name: faculty.username, role: 'Faculty' });
                    }
                }
                
                // Check if user reference exists (Program Chair)
                if (record.user) {
                    const User = (await import('../models/User.js')).default;
                    const user = await User.findById(record.user).select('username').lean();
                    if (user?.username) {
                        creatorsMap.set(user.username, { name: user.username, role: 'Program Chair' });
                    }
                }
            }
            
            return {
                subject: title,
                creators: Array.from(creatorsMap.values())
            };
        }));
        
        // Sort alphabetically
        subjectsWithCreators.sort((a, b) => a.subject.localeCompare(b.subject));
        
        console.log('Final subjects:', subjectsWithCreators.length);
        res.json(subjectsWithCreators);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create a new subject
router.post('/subject', combinedAuth, async (req, res) => {
    try {
        console.log('=== CREATING SUBJECT ===');
        console.log('Request body:', req.body);
        
        const { title, semester, schoolyear, department, facultyId, instructorId } = req.body;
        
        // Accept both facultyId and instructorId for compatibility
        const userId = facultyId || instructorId;
        
        if (!title || !semester || !schoolyear || !department || !userId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Import models
        const Subject = (await import('../models/Subject.js')).default;
        const Faculty = (await import('../models/Faculty.js')).default;
        const User = (await import('../models/User.js')).default;
        
        // Verify the user exists
        let user;
        if (userId) {
            user = await Faculty.findById(userId);
            if (!user) {
                user = await User.findById(userId);
            }
        }
        
        if (!user) {
            return res.status(404).json({ message: 'Instructor not found' });
        }
        
        // Create subject
        const subject = new Subject({
            title,
            semester,
            schoolyear,
            department,
            faculty: userId,
            user: req.user._id, // Current logged-in user (Program Chair or Supervisor)
        });
        
        await subject.save();
        
        console.log('Subject created:', subject);
        res.json({ message: 'Subject created successfully', subject });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ message: error.message });
    }
});

// ============================================
// FACULTY EVALUATION RESULTS ROUTES (Program Chair)
// ============================================

// Get school years for Faculty evaluation
router.get('/faculty-results/school-years/:instructorId', combinedAuth, async (req, res) => {
    try {
        const { instructorId } = req.params;
        
        // Get all subjects for this faculty
        const subjects = await Subject.find({ faculty: instructorId }).select('schoolyear').lean();
        
        // Extract unique school years
        const schoolYears = [...new Set(subjects.map(s => s.schoolyear).filter(Boolean))].sort();
        
        console.log('Faculty School Years:', schoolYears);
        res.json(schoolYears);
    } catch (error) {
        console.error('Error fetching faculty school years:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get departments for Faculty evaluation
router.get('/faculty-results/departments/:instructorId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { instructorId, schoolyear } = req.params;
        
        // Get all subjects for this faculty and school year
        const subjects = await Subject.find({ 
            faculty: instructorId, 
            schoolyear 
        }).select('department').lean();
        
        // Extract unique departments
        const departments = [...new Set(subjects.map(s => s.department).filter(Boolean))].sort();
        
        console.log('Faculty Departments:', departments);
        res.json(departments);
    } catch (error) {
        console.error('Error fetching faculty departments:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get semesters for Faculty evaluation
router.get('/faculty-results/semesters/:instructorId/:schoolyear/:department', combinedAuth, async (req, res) => {
    try {
        const { instructorId, schoolyear, department } = req.params;
        
        // Get all subjects for this faculty, school year, and department
        const subjects = await Subject.find({ 
            faculty: instructorId, 
            schoolyear,
            department 
        }).select('semester').lean();
        
        // Extract unique semesters
        const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort();
        
        console.log('Faculty Semesters:', semesters);
        res.json(semesters);
    } catch (error) {
        console.error('Error fetching faculty semesters:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get subjects for Faculty evaluation
router.get('/faculty-results/subjects/:instructorId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
    try {
        const { instructorId, schoolyear, department, semester } = req.params;
        
        // Get all subjects for this faculty, school year, department, and semester
        const subjects = await Subject.find({ 
            faculty: instructorId, 
            schoolyear,
            department,
            semester 
        }).select('title').lean();
        
        // Extract unique subject titles
        const subjectTitles = [...new Set(subjects.map(s => s.title).filter(Boolean))].sort();
        
        console.log('Faculty Subjects:', subjectTitles);
        res.json(subjectTitles);
    } catch (error) {
        console.error('Error fetching faculty subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get evaluation results for Faculty
router.get('/faculty-results/results/:instructorId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
    try {
        const { instructorId, schoolyear, department, semester, subject } = req.params;
        
        // Get student evaluations
        const studentEvaluations = await Student_Evaluation.find({
            facultyId: instructorId,
            schoolyear,
            department,
            semester,
            subject
        }).populate('studentId', 'username').lean();
        
        // Get program chair evaluations
        const pcEvaluations = await Faculty_Evaluation.find({
            facultyId: instructorId,
            schoolyear,
            department,
            semester,
            subject
        }).populate('programChairId', 'username').lean();
        
        // Combine and format results
        const allEvaluations = [
            ...studentEvaluations.map(e => ({
                _id: e._id,
                name: e.studentId?.username || 'Unknown Student',
                evaluatorType: 'Student',
                points: e.points,
                department: e.department,
                comments: e.comments || ''
            })),
            ...pcEvaluations.map(e => ({
                _id: e._id,
                name: e.programChairId?.username || 'Unknown Program Chair',
                evaluatorType: 'Program Chair',
                points: e.points,
                department: e.department,
                comments: e.comments || ''
            }))
        ];
        
        // Sort by points (highest first)
        allEvaluations.sort((a, b) => b.points - a.points);
        
        console.log('Faculty Evaluation Results:', allEvaluations.length);
        res.json(allEvaluations);
    } catch (error) {
        console.error('Error fetching faculty evaluation results:', error);
        res.status(500).json({ message: error.message });
    }
});

// ============================================
// PROGRAM CHAIR EVALUATION RESULTS ROUTES (Supervisor)
// ============================================

// Get school years for Program Chair evaluation
router.get('/chair-results/school-years/:instructorId', combinedAuth, async (req, res) => {
    try {
        const { instructorId } = req.params;
        
        // Get all subjects for this program chair
        const subjects = await Subject.find({ user: instructorId }).select('schoolyear').lean();
        
        // Extract unique school years
        const schoolYears = [...new Set(subjects.map(s => s.schoolyear).filter(Boolean))].sort();
        
        console.log('Chair School Years:', schoolYears);
        res.json(schoolYears);
    } catch (error) {
        console.error('Error fetching chair school years:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get departments for Program Chair evaluation
router.get('/chair-results/departments/:instructorId/:schoolyear', combinedAuth, async (req, res) => {
    try {
        const { instructorId, schoolyear } = req.params;
        
        // Get all subjects for this program chair and school year
        const subjects = await Subject.find({ 
            user: instructorId, 
            schoolyear 
        }).select('department').lean();
        
        // Extract unique departments
        const departments = [...new Set(subjects.map(s => s.department).filter(Boolean))].sort();
        
        console.log('Chair Departments:', departments);
        res.json(departments);
    } catch (error) {
        console.error('Error fetching chair departments:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get semesters for Program Chair evaluation
router.get('/chair-results/semesters/:instructorId/:schoolyear/:department', combinedAuth, async (req, res) => {
    try {
        const { instructorId, schoolyear, department } = req.params;
        
        // Get all subjects for this program chair, school year, and department
        const subjects = await Subject.find({ 
            user: instructorId, 
            schoolyear,
            department 
        }).select('semester').lean();
        
        // Extract unique semesters
        const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort();
        
        console.log('Chair Semesters:', semesters);
        res.json(semesters);
    } catch (error) {
        console.error('Error fetching chair semesters:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get subjects for Program Chair evaluation
router.get('/chair-results/subjects/:instructorId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
    try {
        const { instructorId, schoolyear, department, semester } = req.params;
        
        // Get all subjects for this program chair, school year, department, and semester
        const subjects = await Subject.find({ 
            user: instructorId, 
            schoolyear,
            department,
            semester 
        }).select('title').lean();
        
        // Extract unique subject titles
        const subjectTitles = [...new Set(subjects.map(s => s.title).filter(Boolean))].sort();
        
        console.log('Chair Subjects:', subjectTitles);
        res.json(subjectTitles);
    } catch (error) {
        console.error('Error fetching chair subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get evaluation results for Program Chair
router.get('/chair-results/results/:instructorId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
    try {
        const { instructorId, schoolyear, department, semester, subject } = req.params;
        
        // Get student evaluations
        const studentEvaluations = await Student_Evaluation.find({
            programChairId: instructorId,
            schoolyear,
            department,
            semester,
            subject
        }).populate('studentId', 'username').lean();
        
        // Get supervisor evaluations
        const supervisorEvaluations = await Faculty_Evaluation.find({
            programChairId: instructorId,
            schoolyear,
            department,
            semester,
            subject
        }).populate('supervisorId', 'username').lean();
        
       const allEvaluations = [
            ...studentEvaluations.map(e => ({
                _id: e._id,
                name: e.studentId?.username || 'Unknown Student',
                evaluatorType: 'Student',
                points: e.points,
                department: e.department,
                comments: e.comments || ''
            })),
            ...supervisorEvaluations.map(e => ({
                _id: e._id,
                name: e.supervisorId?.username || 'Unknown Supervisor',
                evaluatorType: 'Supervisor',
                points: e.points,
                department: e.department,
                comments: e.comments || ''
            }))
        ];
        
        // Sort by points (highest first)
        allEvaluations.sort((a, b) => b.points - a.points);
        
        console.log('Chair Evaluation Results:', allEvaluations.length);
        res.json(allEvaluations);
    } catch (error) {
        console.error('Error fetching chair evaluation results:', error);
        res.status(500).json({ message: error.message });
    }
});


export default router;