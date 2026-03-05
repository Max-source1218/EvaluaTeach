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

// Get school years for Faculty evaluation (Query Subject model using 'faculty' field)
router.get('/faculty-results/school-years/:facultyId', combinedAuth, async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    console.log('=== FETCHING FACULTY SCHOOL YEARS ===');
    console.log('Faculty ID:', facultyId);
    console.log('Authenticated User:', req.user?.username);
    console.log('User Role:', req.user?.role);
    
    // Validate facultyId format
    if (!facultyId || facultyId.trim() === '') {
      console.log('Invalid facultyId');
      return res.status(400).json({ 
        message: 'Invalid faculty ID',
        receivedId: facultyId
      });
    }
    
    // Verify faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      console.log('Faculty not found in database');
      return res.status(404).json({ 
        message: 'Faculty not found',
        facultyId: facultyId,
        availableFacultyCount: await Faculty.countDocuments()
      });
    }
    
    console.log('Faculty found:', faculty.username);
    
    // ✅ Query Subject model using 'faculty' field (NOT evaluation models)
    const subjects = await Subject.find({ faculty: facultyId }).select('schoolyear').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    if (subjects.length === 0) {
      console.log('No subjects found for this faculty');
      return res.status(404).json({ 
        message: 'No school years available',
        facultyId: facultyId,
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
      facultyId: req.params.facultyId
    });
  }
});

// Get departments for Faculty evaluation (Query Subject model using 'faculty' field)
router.get('/faculty-results/departments/:facultyId/:schoolyear', combinedAuth, async (req, res) => {
  try {
    const { facultyId, schoolyear } = req.params;
    
    console.log('=== FETCHING FACULTY DEPARTMENTS ===');
    console.log('Faculty ID:', facultyId);
    console.log('School Year:', schoolyear);
    
    // Verify faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ 
        message: 'Faculty not found',
        facultyId: facultyId
      });
    }
    
    // ✅ Query Subject model using 'faculty' field
    const subjects = await Subject.find({ 
      faculty: facultyId, 
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

// Get semesters for Faculty evaluation (Query Subject model using 'faculty' field)
router.get('/faculty-results/semesters/:facultyId/:schoolyear/:department', combinedAuth, async (req, res) => {
  try {
    const { facultyId, schoolyear, department } = req.params;
    
    console.log('=== FETCHING FACULTY SEMESTERS ===');
    console.log('Faculty ID:', facultyId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    
    // ✅ Query Subject model using 'faculty' field
    const subjects = await Subject.find({ 
      faculty: facultyId, 
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

// Get subjects for Faculty evaluation (Query Subject model using 'faculty' field)
router.get('/faculty-results/subjects/:facultyId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
  try {
    const { facultyId, schoolyear, department, semester } = req.params;
    
    console.log('=== FETCHING FACULTY SUBJECTS ===');
    console.log('Faculty ID:', facultyId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    console.log('Semester:', semester);
    
    // ✅ Query Subject model using 'faculty' field (NOT evaluation models)
    const subjects = await Subject.find({ 
      faculty: facultyId, 
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

// Get evaluation results for Faculty (Query evaluation models using 'facultyId')
router.get('/faculty-results/results/:facultyId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
  try {
    const { facultyId, schoolyear, department, semester, subject } = req.params;
    
    console.log('=== FETCHING FACULTY EVALUATION RESULTS ===');
    console.log('Faculty ID:', facultyId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    console.log('Semester:', semester);
    console.log('Subject:', subject);
    console.log('Authenticated User:', req.user?.username);
    
    // Get student evaluations (using facultyId)
    const studentEvaluations = await Student_Evaluation.find({
      facultyId: facultyId,  // ✅ Use 'facultyId' for Faculty members
      schoolyear,
      department,
      semester,
      title: subject  // ✅ Changed from 'subject' to 'title'
    }).populate('studentId', 'username').lean();
    
    console.log('Student Evaluations Count:', studentEvaluations.length);
    
    // Get program chair evaluations (using facultyId)
    const pcEvaluations = await Faculty_Evaluation.find({
      facultyId: facultyId,  // ✅ Use 'facultyId' for Faculty members
      schoolyear,
      department,
      semester,
      title: subject  // ✅ Changed from 'subject' to 'title'
    }).populate('userId', 'username').lean();
    
    console.log('Program Chair Evaluations Count:', pcEvaluations.length);
    
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
        name: e.userId?.username || 'Unknown Program Chair',
        evaluatorType: 'Program Chair',
        points: e.points,
        department: e.department,
        comments: e.comments || ''
      }))
    ];
    
    // Sort by points (highest first)
    allEvaluations.sort((a, b) => b.points - a.points);
    
    console.log('Total Evaluations:', allEvaluations.length);
    console.log('Evaluations Data:', allEvaluations);
    
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

// Get school years for Program Chair evaluation (Query Subject model using 'user' field)
router.get('/chair-results/school-years/:userId', combinedAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('=== FETCHING CHAIR SCHOOL YEARS ===');
    console.log('User ID:', userId);
    
    // ✅ Query Subject model using 'user' field (Program Chair)
    const subjects = await Subject.find({ 
      user: userId 
    }).select('schoolyear').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    if (subjects.length === 0) {
      console.log('No subjects found for this program chair');
      return res.status(404).json({ 
        message: 'No school years available',
        userId: userId,
        subjectCount: 0,
        availableSchoolYears: []
      });
    }
    
    // Extract unique school years
    const schoolYears = [...new Set(subjects.map(s => s.schoolyear).filter(Boolean))].sort();
    
    console.log('School Years:', schoolYears);
    res.json(schoolYears);
  } catch (error) {
    console.error('Error fetching chair school years:', error);
    res.status(500).json({ 
      message: 'Failed to fetch chair school years',
      error: error.message
    });
  }
});

// Get departments for Program Chair evaluation (Query Subject model using 'user' field)
router.get('/chair-results/departments/:userId/:schoolyear', combinedAuth, async (req, res) => {
  try {
    const { userId, schoolyear } = req.params;
    
    console.log('=== FETCHING CHAIR DEPARTMENTS ===');
    console.log('User ID:', userId);
    console.log('School Year:', schoolyear);
    
    // ✅ Query Subject model using 'user' field (Program Chair)
    const subjects = await Subject.find({ 
      user: userId, 
      schoolyear 
    }).select('department').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    // Extract unique departments
    const departments = [...new Set(subjects.map(s => s.department).filter(Boolean))].sort();
    
    console.log('Departments:', departments);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching chair departments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch chair departments',
      error: error.message
    });
  }
});

// Get semesters for Program Chair evaluation (Query Subject model using 'user' field)
router.get('/chair-results/semesters/:userId/:schoolyear/:department', combinedAuth, async (req, res) => {
  try {
    const { userId, schoolyear, department } = req.params;
    
    console.log('=== FETCHING CHAIR SEMESTERS ===');
    console.log('User ID:', userId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    
    // ✅ Query Subject model using 'user' field (Program Chair)
    const subjects = await Subject.find({ 
      user: userId, 
      schoolyear,
      department 
    }).select('semester').lean();
    
    console.log('Total subjects found:', subjects.length);
    
    // Extract unique semesters
    const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort();
    
    console.log('Semesters:', semesters);
    res.json(semesters);
  } catch (error) {
    console.error('Error fetching chair semesters:', error);
    res.status(500).json({ 
      message: 'Failed to fetch chair semesters',
      error: error.message
    });
  }
});

// Get subjects for Program Chair evaluation (Query Subject model using 'user' field)
router.get('/chair-results/subjects/:userId/:schoolyear/:department/:semester', combinedAuth, async (req, res) => {
  try {
    const { userId, schoolyear, department, semester } = req.params;
    
    console.log('=== FETCHING CHAIR SUBJECTS ===');
    console.log('User ID:', userId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    console.log('Semester:', semester);
    
    // ✅ Query Subject model using 'user' field (Program Chair)
    const subjects = await Subject.find({ 
      user: userId, 
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

// Get evaluation results for Program Chair (Query evaluation models using 'userId')
// Get evaluation results for Program Chair (Query evaluation models using 'userId')
// Get evaluation results for Faculty
router.get('/faculty-results/results/:facultyId/:schoolyear/:department/:semester/:subject', combinedAuth, async (req, res) => {
  try {
    const { facultyId, schoolyear, department, semester, subject } = req.params;
    
    console.log('=== FETCHING FACULTY EVALUATION RESULTS ===');
    console.log('Faculty ID:', facultyId);
    console.log('School Year:', schoolyear);
    console.log('Department:', department);
    console.log('Semester:', semester);
    console.log('Subject:', subject);
    
    // Get student evaluations (using facultyId)
    const studentEvaluations = await Student_Evaluation.find({
      facultyId: facultyId,  // ✅ Use 'facultyId' for Faculty members
      schoolyear,
      department,
      semester,
      title: subject
    }).populate('studentId', 'username').lean();
    
    console.log('Student Evaluations Count:', studentEvaluations.length);
    if (studentEvaluations.length > 0) {
      console.log('Sample Student Evaluation:', JSON.stringify(studentEvaluations[0], null, 2));
    }
    
    // Get program chair evaluations (using facultyId)
    const pcEvaluations = await Faculty_Evaluation.find({
      facultyId: facultyId,
      schoolyear,
      department,
      semester,
      title: subject
    }).populate('userId', 'username').lean();
    
    console.log('Program Chair Evaluations Count:', pcEvaluations.length);
    if (pcEvaluations.length > 0) {
      console.log('Sample PC Evaluation:', JSON.stringify(pcEvaluations[0], null, 2));
    }
    
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
        name: e.userId?.username || 'Unknown Program Chair',
        evaluatorType: 'Program Chair',
        points: e.points,
        department: e.department,
        comments: e.comments || ''
      }))
    ];
    
    // Sort by points (highest first)
    allEvaluations.sort((a, b) => b.points - a.points);
    
    console.log('Total Evaluations:', allEvaluations.length);
    console.log('Evaluations Data:', allEvaluations);
    
    res.json(allEvaluations);
  } catch (error) {
    console.error('Error fetching faculty evaluation results:', error);
    res.status(500).json({ 
      message: 'Failed to fetch evaluation results',
      error: error.message
    });
  }
});
// Debug: Check if faculty exists
router.get('/debug/faculty/:facultyId', combinedAuth, async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ 
        message: 'Faculty not found',
        facultyId: facultyId
      });
    }
    
    const subjects = await Subject.find({ faculty: facultyId }).lean();
    
    res.json({
      faculty: {
        _id: faculty._id,
        username: faculty.username,
        department: faculty.department
      },
      subjectCount: subjects.length,
      schoolYears: [...new Set(subjects.map(s => s.schoolyear).filter(Boolean))]
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      message: 'Debug error',
      error: error.message
    });
  }
});

// Debug: Check if user exists
router.get('/debug/user/:userId', combinedAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        userId: userId
      });
    }
    
    const subjects = await Subject.find({ user: userId }).lean();
    
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      },
      subjectCount: subjects.length,
      schoolYears: [...new Set(subjects.map(s => s.schoolyear).filter(Boolean))]
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      message: 'Debug error',
      error: error.message
    });
  }
});

// Debug: Check all subjects
router.get('/debug-all-subjects', combinedAuth, async (req, res) => {
  try {
    const allSubjects = await Subject.find()
      .populate('faculty', 'username department')
      .populate('user', 'username role');
    
    console.log('=== DEBUG ALL SUBJECTS ===');
    console.log('Total subjects:', allSubjects.length);
    
    res.json({
      total: allSubjects.length,
      subjects: allSubjects.map(s => ({
        _id: s._id,
        title: s.title,
        semester: s.semester,
        schoolyear: s.schoolyear,
        department: s.department,
        hasFaculty: !!s.faculty,
        hasUser: !!s.user,
        facultyName: s.faculty?.username,
        userName: s.user?.username,
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      message: 'Debug error',
      error: error.message 
    });
  }
});

// Get all subjects with creators
router.get('/all-subjects', combinedAuth, async (req, res) => {
  try {
    console.log('=== FETCHING ALL SUBJECTS ===');
    
    // Get all subjects
    const allSubjects = await Subject.find().lean();
    console.log('Total subjects in DB:', allSubjects.length);
    
    if (allSubjects.length === 0) {
      console.log('No subjects found');
      return res.json([]);
    }
    
    // Get unique subject titles
    const uniqueTitles = [...new Set(allSubjects.map(s => s.title).filter(Boolean))].sort();
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
          const faculty = await Faculty.findById(record.faculty).select('username department').lean();
          if (faculty?.username) {
            creatorsMap.set(faculty.username, { 
              name: faculty.username, 
              role: 'Faculty',
              department: faculty.department
            });
          }
        }
        
        // Check if user reference exists (Program Chair)
        if (record.user) {
          const user = await User.findById(record.user).select('username role').lean();
          if (user?.username) {
            creatorsMap.set(user.username, { 
              name: user.username, 
              role: 'Program Chair',
              department: user.department || 'N/A'
            });
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
    res.status(500).json({ 
      message: 'Failed to fetch subjects',
      error: error.message 
    });
  }
});

export default router;