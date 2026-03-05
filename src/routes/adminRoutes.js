import express from 'express';
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import SupervisorForm from "../models/SupervisorForm.js";
import protectRoute from "../middleware/auth.middleware.js";
import combinedAuth from '../middleware/combinedAuth.middleware.js';

const router = express.Router();

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
// Get all subjects
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

export default router;