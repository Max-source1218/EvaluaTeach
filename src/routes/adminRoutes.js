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
router.get('/all-subjects', combinedAuth, async (req, res) => {
    try {
        console.log('=== FETCHING ALL SUBJECTS ===');
        
        // Get all faculty
        const allFaculty = await Faculty.find().lean();
        console.log('Total faculty found:', allFaculty.length);
        
        if (allFaculty.length === 0) {
            return res.json([]);
        }
        
        // Check first faculty to see structure
        const sample = allFaculty[0];
        console.log('Sample faculty fields:', Object.keys(sample));
        console.log('Sample faculty data:', JSON.stringify(sample));
        
        // Try to find subjects - check if it's an array field
        let allSubjects = [];
        
        // Common field names for subjects
        const possibleFields = ['subjects', 'subject', 'subjectList', 'teachingSubjects', 'assignedSubjects'];
        
        allFaculty.forEach(faculty => {
            possibleFields.forEach(fieldName => {
                const fieldValue = faculty[fieldName];
                if (fieldValue) {
                    if (Array.isArray(fieldValue)) {
                        allSubjects = [...allSubjects, ...fieldValue];
                    } else if (typeof fieldValue === 'string' && fieldValue.trim()) {
                        allSubjects.push(fieldValue);
                    }
                }
            });
        });
        
        // Remove duplicates
        const uniqueSubjects = [...new Set(allSubjects)].filter(Boolean);
        console.log('Unique subjects:', uniqueSubjects);
        
        // Build response
        const subjectsWithCreators = uniqueSubjects.map(subject => {
            const creators = [];
            
            allFaculty.forEach(faculty => {
                possibleFields.forEach(fieldName => {
                    const fieldValue = faculty[fieldName];
                    if (fieldValue) {
                        const subjects = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
                        if (subjects.includes(subject)) {
                            creators.push({
                                name: faculty.username,
                                role: 'Faculty'
                            });
                        }
                    }
                });
            });
            
            return {
                subject,
                creators: [...new Map(creators.map(c => [c.name, c])).values()]
            };
        });
        
        // Sort alphabetically
        subjectsWithCreators.sort((a, b) => a.subject.localeCompare(b.subject));
        
        console.log('Final result:', subjectsWithCreators.length, 'subjects');
        res.json(subjectsWithCreators);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;