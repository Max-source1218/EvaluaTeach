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

// DEBUG: Check Faculty model structure
router.get('/debug-faculty', combinedAuth, async (req, res) => {
    try {
        const sampleFaculty = await Faculty.find().limit(3).lean();
        
        if (!sampleFaculty || sampleFaculty.length === 0) {
            return res.json({ message: "No faculty found in database" });
        }
        
        const result = sampleFaculty.map(f => ({
            _id: f._id,
            username: f.username,
            fields: Object.keys(f),
            subjects: f.subjects,
            subject: f.subject,
            subjectsAssigned: f.subjectsAssigned,
            assignedSubjects: f.assignedSubjects,
            teachingSubjects: f.teachingSubjects,
            allData: f
        }));
        
        console.log('Debug faculty result:', JSON.stringify(result, null, 2));
        res.json(result);
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all subjects with creators
router.get('/all-subjects', combinedAuth, async (req, res) => {
    try {
        console.log('=== FETCHING ALL SUBJECTS ===');
        
        const allFaculty = await Faculty.find().lean();
        console.log('Total faculty:', allFaculty.length);
        
        let allSubjects = [];
        
        allFaculty.forEach(faculty => {
            const subjectFields = [
                faculty.subjects,
                faculty.subject,
                faculty.subjectsAssigned,
                faculty.assignedSubjects,
                faculty.teachingSubjects
            ];
            
            subjectFields.forEach(field => {
                if (field) {
                    if (Array.isArray(field)) {
                        allSubjects = [...allSubjects, ...field];
                    } else if (typeof field === 'string') {
                        allSubjects.push(field);
                    }
                }
            });
        });
        
        const uniqueSubjects = [...new Set(allSubjects)].filter(Boolean);
        console.log('Unique subjects found:', uniqueSubjects.length);
        console.log('Subjects:', uniqueSubjects);
        
        const subjectMap = new Map();
        
        allFaculty.forEach(faculty => {
            const subjectFields = [
                faculty.subjects,
                faculty.subject,
                faculty.subjectsAssigned,
                faculty.assignedSubjects,
                faculty.teachingSubjects
            ];
            
            subjectFields.forEach(field => {
                if (field) {
                    const subjects = Array.isArray(field) ? field : [field];
                    subjects.forEach(subj => {
                        if (subj && !subjectMap.has(subj)) {
                            subjectMap.set(subj, []);
                        }
                        if (subj) {
                            subjectMap.get(subj).push({
                                name: faculty.username,
                                role: 'Faculty'
                            });
                        }
                    });
                }
            });
        });
        
        const subjectsWithCreators = Array.from(subjectMap.entries()).map(([subject, creators]) => ({
            subject,
            creators: [...new Map(creators.map(c => [c.name, c])).values()]
        }));
        
        subjectsWithCreators.sort((a, b) => a.subject.localeCompare(b.subject));
        
        console.log('Final subjects with creators:', subjectsWithCreators.length);
        res.json(subjectsWithCreators);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;