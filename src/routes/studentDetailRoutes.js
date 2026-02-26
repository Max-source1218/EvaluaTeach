import express from "express";
import Student_Detail from "../models/StudentForm.js";
import Subject from "../models/Subject.js";
import protectRouteStudent from "../middleware/student.middleware.js";

const router = express.Router();

// Create student detail
router.post("/", protectRouteStudent, async (req, res) => {
    try {
        const { name, department, course, year_level, schoolyear, semester } = req.body;
        const userId = req.user._id;

        console.log('=== CREATE STUDENT DETAIL ===');
        console.log('User ID:', userId);

        if (!department || !course || !year_level || !schoolyear || !semester) {
            return res.status(400).json({ message: "Please provide all required details" });
        }

        // Check if student already has details
        const existingDetail = await Student_Detail.findOne({ user: userId });
        if (existingDetail) {
            // Update existing
            existingDetail.name = name || existingDetail.name;
            existingDetail.department = department;
            existingDetail.course = course;
            existingDetail.year_level = year_level;
            existingDetail.schoolyear = schoolyear;
            existingDetail.semester = semester;
            
            await existingDetail.save();
            console.log("Student detail updated:", existingDetail._id);
            
            return res.status(200).json({ message: 'Details updated successfully', newForm: existingDetail });
        }

        // Create new
        const newForm = new Student_Detail({
            name,
            department,
            course,
            year_level,
            schoolyear,
            semester,
            user: userId,
        });
        
        await newForm.save();
        console.log("Student detail saved:", newForm._id);

        res.status(201).json({ message: 'Details saved successfully', newForm });
    } catch (err) {
        console.log("Error creating student detail: ", err.message);
        res.status(500).json({ message: err.message });
    }
});

// Get current student's detail
router.get("/user", protectRouteStudent, async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('=== GET STUDENT DETAIL ===');
        console.log('User ID:', userId);

        const studentForm = await Student_Detail.findOne({ user: userId });
        if (!studentForm) {
            return res.status(404).json({ message: 'No details found' });
        }
        
        console.log('Student detail found:', studentForm._id);
        res.json(studentForm);
    } catch (error) {
        console.error("Get student details error", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all students (for admin)
router.get("/all", protectRouteStudent, async (req, res) => {
    try {
        const students = await Student_Detail.find()
            .populate('user', 'username email')
            .sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        console.error("Get all students error", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get evaluators (Faculty AND Program Chair) with their subjects
router.get('/evaluators', protectRouteStudent, async (req, res) => {
    try {
        const { department, schoolyear, semester } = req.query;

        if (!department || !schoolyear || !semester) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        console.log('=== FETCHING EVALUATORS ===');
        console.log('Params:', { department, schoolyear, semester });

        // Fetch subjects matching the filters
        const subjects = await Subject.find({
            department,
            schoolyear,
            semester
        })
        .populate('faculty', 'username department profileImage')
        .populate('user', 'username department profileImage');

        console.log('Subjects found:', subjects.length);

        // Group evaluators (both Faculty and Program Chair)
        const evaluatorsMap = {};
        
        subjects.forEach(subject => {
            let evaluatorId, evaluatorName, evaluatorType, evaluatorDepartment;
            
            // Check if it's a Faculty subject
            if (subject.faculty && subject.faculty._id) {
                evaluatorId = subject.faculty._id.toString();
                evaluatorName = subject.faculty.username;
                evaluatorType = 'faculty';
                evaluatorDepartment = subject.faculty.department;
            }
            // Check if it's a Program Chair (User) subject
            else if (subject.user && subject.user._id) {
                evaluatorId = subject.user._id.toString();
                evaluatorName = subject.user.username;
                evaluatorType = 'programchair';
                evaluatorDepartment = subject.user.department;
            }
            
            if (!evaluatorId) return;
            
            if (!evaluatorsMap[evaluatorId]) {
                evaluatorsMap[evaluatorId] = {
                    _id: evaluatorId,
                    name: evaluatorName || 'Unknown',
                    type: evaluatorType,
                    department: evaluatorDepartment || department,
                    subjects: [],
                };
            }
            
            evaluatorsMap[evaluatorId].subjects.push({
                _id: subject._id,
                title: subject.title,
            });
        });

        const evaluators = Object.values(evaluatorsMap);
        console.log('Evaluators grouped:', evaluators.length);
        
        // Separate into two arrays for easier frontend handling
        const facultyEvaluators = evaluators.filter(e => e.type === 'faculty');
        const programChairEvaluators = evaluators.filter(e => e.type === 'programchair');

        console.log('Faculty evaluators:', facultyEvaluators.length);
        console.log('Program Chair evaluators:', programChairEvaluators.length);

        res.json({
            faculty: facultyEvaluators,
            programChairs: programChairEvaluators,
            total: evaluators.length
        });
    } catch (error) {
        console.error('Error fetching evaluators:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;