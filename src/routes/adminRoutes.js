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

// ============================================
// FACULTY EVALUATION RESULTS ROUTES (Program Chair)
// ============================================

// Get school years for Faculty evaluation
router.get('/faculty-results/school-years/:instructorId', combinedAuth, async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    console.log('=== FETCHING FACULTY SCHOOL YEARS ===');
    console.log('Instructor ID:', instructorId);
    console.log('Authenticated User:', req.user?.username);
    console.log('User Role:', req.user?.role);
    
    // Validate instructorId format
    if (!instructorId || instructorId.trim() === '') {
      console.log('Invalid instructorId');
      return res.status(400).json({ 
        message: 'Invalid instructor ID',
        receivedId: instructorId
      });
    }
    
    // Verify faculty exists
    const faculty = await Faculty.findById(instructorId);
    if (!faculty) {
      console.log('Faculty not found in database');
      return res.status(404).json({ 
        message: 'Faculty not found',
        instructorId: instructorId,
        availableFacultyCount: await Faculty.countDocuments()
      });
    }
    
    console.log('Faculty found:', faculty.username);
    
    // Get all subjects for this faculty
    const subjects = await Subject.find({ faculty: instructorId }).select('schoolyear').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    if (subjects.length === 0) {
      console.log('No subjects found for this faculty');
      return res.status(404).json({ 
        message: 'No school years available',
        instructorId: instructorId,
        facultyName: faculty.username,
        subjectCount: 0,
        availableSchoolYears: []
      });
    }
    
    // Extract unique school years
    const schoolYears = [...new Set(subjects.map(s => s.schoolyear).filter(Boolean))].sort();
    
    console.log('School Years:', schoolYears);
    res.json(schoolYears);
  } catch (error) {
    console.error('=== ERROR FETCHING FACULTY SCHOOL YEARS ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch school years',
      error: error.message,
      instructorId: req.params.instructorId
    });
  }
});

// Get departments for Faculty evaluation
router.get('/faculty-results/departments/:instructorId/:schoolyear', combinedAuth, async (req, res) => {
  try {
    const { instructorId, schoolyear } = req.params;
    
    console.log('=== FETCHING FACULTY DEPARTMENTS ===');
    console.log('Instructor ID:', instructorId);
    console.log('School Year:', schoolyear);
    
    // Verify faculty exists
    const faculty = await Faculty.findById(instructorId);
    if (!faculty) {
      return res.status(404).json({ 
        message: 'Faculty not found',
        instructorId: instructorId
      });
    }
    
    // Get all subjects for this faculty and school year
    const subjects = await Subject.find({ 
      faculty: instructorId, 
      schoolyear 
    }).select('department').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    // Extract unique departments
    const departments = [...new Set(subjects.map(s => s.department).filter(Boolean))].sort();
    
    console.log('Departments:', departments);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching faculty departments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
});

// Get semesters for Faculty evaluation
router.get('/faculty-results/semesters/:instructorId/:schoolyear/:department', combinedAuth, async (req, res) => {
  try {
    const { instructorId, schoolyear, department } = req.params;
    
    console.log('=== FETCHING FACULTY SEMESTERS ===');
    console.log('Instructor ID:', instructorId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    
    // Get all subjects for this faculty, school year, and department
    const subjects = await Subject.find({ 
      faculty: instructorId, 
      schoolyear,
      department 
    }).select('semester').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    // Extract unique semesters
    const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort();
    
    console.log('Semesters:', semesters);
    res.json(semesters);
  } catch (error) {
    console.error('Error fetching faculty semesters:', error);
    res.status(500).json({ 
      message: 'Failed to fetch semesters',
      error: error.message
    });
  }
});

// Get subjects for Faculty evaluation
router.get('/faculty-results/subjects/:instructorId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
  try {
    const { instructorId, schoolyear, department, semester } = req.params;
    
    console.log('=== FETCHING FACULTY SUBJECTS ===');
    console.log('Instructor ID:', instructorId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    console.log('Semester:', semester);
    
    // Get all subjects for this faculty, school year, department, and semester
    const subjects = await Subject.find({ 
      faculty: instructorId, 
      schoolyear,
      department,
      semester 
    }).select('title').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    // Extract unique subject titles
    const subjectTitles = [...new Set(subjects.map(s => s.title).filter(Boolean))].sort();
    
    console.log('Subject Titles:', subjectTitles);
    res.json(subjectTitles);
  } catch (error) {
    console.error('Error fetching faculty subjects:', error);
    res.status(500).json({ 
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
});

// Get evaluation results for Faculty
router.get('/faculty-results/results/:instructorId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
  try {
    const { instructorId, schoolyear, department, semester, subject } = req.params;
    
    console.log('=== FETCHING FACULTY EVALUATION RESULTS ===');
    console.log('Instructor ID:', instructorId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    console.log('Semester:', semester);
    console.log('Subject:', subject);
    
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
    res.status(500).json({ 
      message: 'Failed to fetch evaluation results',
      error: error.message
    });
  }
});

// ============================================
// PROGRAM CHAIR EVALUATION RESULTS ROUTES (Supervisor)
// ============================================

// Get school years for Program Chair evaluation
router.get('/chair-results/school-years/:instructorId', combinedAuth, async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    console.log('=== FETCHING CHAIR SCHOOL YEARS ===');
    console.log('Instructor ID:', instructorId);
    
    // Verify user exists
    const user = await User.findById(instructorId);
    if (!user) {
      return res.status(404).json({ 
        message: 'Program Chair not found',
        instructorId: instructorId
      });
    }
    
    // Get all subjects for this program chair
    const subjects = await Subject.find({ user: instructorId }).select('schoolyear').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    // Extract unique school years
    const schoolYears = [...new Set(subjects.map(s => s.schoolyear).filter(Boolean))].sort();
    
    console.log('Chair School Years:', schoolYears);
    res.json(schoolYears);
  } catch (error) {
    console.error('Error fetching chair school years:', error);
    res.status(500).json({ 
      message: 'Failed to fetch chair school years',
      error: error.message
    });
  }
});

// Get departments for Program Chair evaluation
router.get('/chair-results/departments/:instructorId/:schoolyear', combinedAuth, async (req, res) => {
  try {
    const { instructorId, schoolyear } = req.params;
    
    console.log('=== FETCHING CHAIR DEPARTMENTS ===');
    console.log('Instructor ID:', instructorId);
    console.log('School Year:', schoolyear);
    
    // Get all subjects for this program chair and school year
    const subjects = await Subject.find({ 
      user: instructorId, 
      schoolyear 
    }).select('department').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    // Extract unique departments
    const departments = [...new Set(subjects.map(s => s.department).filter(Boolean))].sort();
    
    console.log('Chair Departments:', departments);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching chair departments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch chair departments',
      error: error.message
    });
  }
});

// Get semesters for Program Chair evaluation
router.get('/chair-results/semesters/:instructorId/:schoolyear/:department', combinedAuth, async (req, res) => {
  try {
    const { instructorId, schoolyear, department } = req.params;
    
    console.log('=== FETCHING CHAIR SEMESTERS ===');
    console.log('Instructor ID:', instructorId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    
    // Get all subjects for this program chair, school year, and department
    const subjects = await Subject.find({ 
      user: instructorId, 
      schoolyear,
      department 
    }).select('semester').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    // Extract unique semesters
    const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort();
    
    console.log('Chair Semesters:', semesters);
    res.json(semesters);
  } catch (error) {
    console.error('Error fetching chair semesters:', error);
    res.status(500).json({ 
      message: 'Failed to fetch chair semesters',
      error: error.message
    });
  }
});

// Get subjects for Program Chair evaluation
router.get('/chair-results/subjects/:instructorId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
  try {
    const { instructorId, schoolyear, department, semester } = req.params;
    
    console.log('=== FETCHING CHAIR SUBJECTS ===');
    console.log('Instructor ID:', instructorId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    console.log('Semester:', semester);
    
    // Get all subjects for this program chair, school year, department, and semester
    const subjects = await Subject.find({ 
      user: instructorId, 
      schoolyear,
      department,
      semester 
    }).select('title').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    // Extract unique subject titles
    const subjectTitles = [...new Set(subjects.map(s => s.title).filter(Boolean))].sort();
    
    console.log('Subject Titles:', subjectTitles);
    res.json(subjectTitles);
  } catch (error) {
    console.error('Error fetching chair subjects:', error);
    res.status(500).json({ 
      message: 'Failed to fetch chair subjects',
      error: error.message
    });
  }
});

// Get evaluation results for Program Chair
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
    res.status(500).json({ 
      message: 'Failed to fetch chair evaluation results',
      error: error.message
    });
  }
});


export default router;