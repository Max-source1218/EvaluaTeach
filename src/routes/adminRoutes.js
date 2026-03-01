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
        console.log('=== GET /program-chairs ===');
        
        const programChairs = await User.find({ role: 'Program Chair' }).select('-password');
        
        // Get department from SupervisorForm for each Program Chair
        const programChairsWithDepartment = await Promise.all(
            programChairs.map(async (pc) => {
                // Find the most recent SupervisorForm for this user
                const supervisorForm = await SupervisorForm.findOne({ user: pc._id })
                    .sort({ createdAt: -1 });
                
                return {
                    _id: pc._id,
                    username: pc.username,
                    email: pc.email,
                    role: pc.role,
                    profileImage: pc.profileImage,
                    department: supervisorForm?.department || 'N/A',  // Get department from SupervisorForm
                    createdAt: pc.createdAt,
                };
            })
        );
        
        console.log('Program chairs found:', programChairsWithDepartment.length);
        res.json(programChairsWithDepartment);
    } catch (error) {
        console.log("Error fetching program chairs:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all Faculty (for Program Chairs)
router.get("/faculty", protectRoute, async (req, res) => {
    try {
        console.log('=== GET /faculty ===');
        
        const faculty = await Faculty.find().select('-password');
        
        // Faculty already has department in their model
        const facultyWithDepartment = faculty.map(f => ({
            _id: f._id,
            username: f.username,
            email: f.email,
            role: 'Faculty',
            profileImage: f.profileImage,
            department: f.department || 'N/A',
            createdAt: f.createdAt,
        }));
        
        console.log('Faculty found:', facultyWithDepartment.length);
        res.json(facultyWithDepartment);
    } catch (error) {
        console.log("Error fetching faculty:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all subjects with creators
router.get('/all-subjects', combinedAuth, async (req, res) => {
    try {
        console.log('=== FETCHING ALL SUBJECTS ===');
        
        // Get subjects from Faculty collection
        const facultySubjects = await Faculty.distinct('subjects', { });
        
        // For now, get all Program Chairs to show as potential creators
        // (Subjects for Program Chairs may be stored differently in your system)
        const programChairs = await User.find({ role: 'Program Chair' }).select('username');

        // Get unique subjects from Faculty
        const allSubjects = [...new Set(facultySubjects)].filter(Boolean);
        
        // For each subject, get the faculty creators
        const subjectsWithCreators = await Promise.all(allSubjects.map(async (subject) => {
            // Find faculty who have this subject
            const facultyWithSubject = await Faculty.find({ subjects: subject }).select('username');
            
            return {
                subject,
                creators: [
                    ...facultyWithSubject.map(f => ({ name: f.username, role: 'Faculty' })),
                ]
            };
        }));

        console.log('Subjects:', subjectsWithCreators.length);
        res.json(subjectsWithCreators);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;