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

// Debug route - check Faculty model structure
router.get('/debug-faculty', combinedAuth, async (req, res) => {
    try {
        // Get one faculty to see its structure
        const sampleFaculty = await Faculty.findOne();
        
        if (!sampleFaculty) {
            return res.json({ message: "No faculty found" });
        }
        
        // Return all field names
        const fields = Object.keys(sampleFaculty.toObject());
        
        // Try different possible subject fields
        const possibleSubjectFields = ['subjects', 'subject', 'subjectsAssigned', 'assignedSubjects', 'teachingSubjects'];
        const foundSubjects = {};
        
        for (const field of possibleSubjectFields) {
            if (sampleFaculty[field]) {
                foundSubjects[field] = sampleFaculty[field];
            }
        }
        
        res.json({
            fields,
            sampleData: sampleFaculty.toObject(),
            foundSubjects
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all subjects with creators
router.get('/all-subjects', combinedAuth, async (req, res) => {
    try {
        console.log('=== FETCHING ALL SUBJECTS ===');
        
        // Get sample faculty to check structure
        const sampleFaculty = await Faculty.findOne();
        console.log('Sample faculty fields:', Object.keys(sampleFaculty?.toObject() || {}));
        
        // Try different possible subject fields
        let facultySubjects = [];
        const possibleFields = ['subjects', 'subject', 'subjectsAssigned', 'assignedSubjects', 'teachingSubjects'];
        
        for (const field of possibleFields) {
            if (sampleFaculty && sampleFaculty[field]) {
                facultySubjects = await Faculty.distinct(field, {});
                console.log(`Found subjects in field: ${field}`, facultySubjects);
                break;
            }
        }
        
        // Get all Program Chairs
        const programChairs = await User.find({ role: 'Program Chair' }).select('username');

        // Get unique subjects
        const allSubjects = [...new Set(facultySubjects)].filter(Boolean);
        console.log('Total unique subjects:', allSubjects.length);
        
        // For each subject, get the creators
        const subjectsWithCreators = await Promise.all(allSubjects.map(async (subject) => {
            // Find faculty who have this subject
            let facultyWithSubject = [];
            
            for (const field of possibleFields) {
                if (sampleFaculty && sampleFaculty[field]) {
                    facultyWithSubject = await Faculty.find({ [field]: subject }).select('username');
                    if (facultyWithSubject.length > 0) break;
                }
            }
            
            return {
                subject,
                creators: [
                    ...facultyWithSubject.map(f => ({ name: f.username, role: 'Faculty' })),
                ]
            };
        }));

        console.log('Subjects with creators:', subjectsWithCreators.length);
        res.json(subjectsWithCreators);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;