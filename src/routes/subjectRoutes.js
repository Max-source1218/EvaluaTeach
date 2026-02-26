import express from "express";
import Subject from "../models/Subject.js";
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import protectRoute from "../middleware/auth.middleware.js";
import protectRouteStudent from "../middleware/student.middleware.js";

const router = express.Router();

// Create a new subject
router.post('/', protectRoute, async (request, response) => {
    try {
        const { title, semester, schoolyear, department, instructorId } = request.body;

        let subjectData = {
            title,
            semester,
            schoolyear,
            department,
        };
        
        const user = await User.findById(instructorId);
        if (user) {
            subjectData.user = instructorId;
        } else {
            const faculty = await Faculty.findById(instructorId);
            if (faculty) {
                subjectData.faculty = instructorId;
            } else {
                return response.status(404).json({ message: 'Instructor not found' });
            }
        }

        const newSubject = new Subject(subjectData);
        await newSubject.save();
        response.status(201).json(newSubject);
    } catch (error) {
        console.error('Error creating subject:', error);
        response.status(500).json({ message: error.message });
    }
});

// Get subjects for a specific user (Program Chair/Supervisor)
router.get("/user", protectRoute, async (request, response) => {
    try {
        const subjects = await Subject.find({ user: request.user._id }).sort({ createdAt: -1 });
        response.json(subjects);
    } catch (error) {
        console.error("Get user subjects error", error.message);
        response.status(500).json({ message: "Server error" });
    }
});

// Get subjects for a specific faculty
router.get("/faculty/:facultyId", protectRouteStudent, async (request, response) => {
    try {
        const subjects = await Subject.find({ faculty: request.params.facultyId }).sort({ createdAt: -1 });
        response.json(subjects);
    } catch (error) {
        console.error("Get faculty subjects error", error.message);
        response.status(500).json({ message: "Server error" });
    }
});

// Delete a subject
router.delete("/:id", protectRoute, async (request, response) => {
    try {
        const subject = await Subject.findById(request.params.id);
        if (!subject) return response.status(404).json({ message: "Subject not found" });

        if (subject.user && subject.user.toString() !== request.user._id.toString()) {
            return response.status(401).json({ message: "Unauthorized" });
        }

        await Subject.findByIdAndDelete(request.params.id);
        response.json({ message: "Subject deleted successfully" });
    } catch (error) {
        console.log("Error deleting subject", error);
        response.status(500).json({ message: "Internal server error" });
    }
});

// routes/subjectRoutes.js

// Filter subjects by schoolyear, semester, department, and type
// routes/subjectRoutes.js

// Filter subjects by schoolyear, semester, department, and type
router.get('/filter', protectRoute, async (req, res) => {
    try {
        const { schoolyear, semester, department, type } = req.query;

        if (!schoolyear || !semester || !department) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        let subjects;
        
        if (type === 'faculty') {
            // ✅ Changed: populate 'username' instead of 'name'
            subjects = await Subject.find({ 
                schoolyear, 
                semester, 
                department 
            }).populate('faculty', 'username department profileImage');
        } else {
            subjects = await Subject.find({ 
                schoolyear, 
                semester, 
                department 
            }).populate('user', 'name department');
        }

        // Group by instructor/faculty
        const instructorsMap = {};
        
        subjects.forEach(subject => {
            let userId, userName, userDepartment, userProfileImage;
            
            if (type === 'faculty') {
                userId = subject.faculty?._id?.toString();
                // ✅ Changed: use 'username' instead of 'name'
                userName = subject.faculty?.username || subject.faculty?.name || 'Unknown';
                userDepartment = subject.faculty?.department;
                userProfileImage = subject.faculty?.profileImage;
            } else {
                userId = subject.user?._id?.toString();
                userName = subject.user?.name || 'Unknown';
                userDepartment = subject.user?.department;
                userProfileImage = subject.user?.profileImage;
            }
            
            if (!instructorsMap[userId]) {
                instructorsMap[userId] = {
                    _id: userId,
                    name: userName,
                    department: userDepartment || department,
                    profileImage: userProfileImage,
                    subjects: [],
                };
            }
            
            instructorsMap[userId].subjects.push({
                _id: subject._id,
                title: subject.title,
            });
        });

        const instructors = Object.values(instructorsMap);
        res.json({ instructors });
    } catch (error) {
        console.error('Error filtering subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
export default router;