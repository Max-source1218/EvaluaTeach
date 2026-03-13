import express from "express";
import Student_Detail from "../models/StudentForm.js";
import Subject from "../models/Subject.js";
import protectRouteStudent from "../middleware/student.middleware.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Create or update student detail
router.post("/", protectRouteStudent, async (req, res) => {
    try {
        const { name, department, course, year_level, schoolyear, semester } = req.body;
        const userId = req.user._id;

        if (!department || !course || !year_level || !schoolyear || !semester) {
            return res.status(400).json({ message: "Please provide all required details" });
        }

        // ✅ Atomic upsert — no race condition, same fix as supervisorDetailRoutes
        const form = await Student_Detail.findOneAndUpdate(
            { user: userId },
            { name: name || '', department, course, year_level, schoolyear, semester },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ message: 'Details saved successfully', newForm: form });
    } catch (err) {
        console.error("Error saving student detail:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// Get current student's detail
router.get("/user", protectRouteStudent, async (req, res) => {
    try {
        const studentForm = await Student_Detail.findOne({ user: req.user._id });
        if (!studentForm) {
            return res.status(404).json({ message: 'No details found' });
        }
        res.json(studentForm);
    } catch (error) {
        console.error("Get student details error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all student details — Supervisor/Program Chair only
// ✅ Fixed: was protectRouteStudent (any student could access this)
router.get("/all", protectRoute, async (req, res) => {
    try {
        const students = await Student_Detail.find()
            .populate('user', 'username email')
            .sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        console.error("Get all students error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get evaluators (Faculty + Program Chair) with their subjects
// Used by students to find who they can evaluate
router.get('/evaluators', protectRouteStudent, async (req, res) => {
    try {
        const { department, schoolyear, semester } = req.query;

        if (!department || !schoolyear || !semester) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const subjects = await Subject.find({ department, schoolyear, semester })
            .populate('faculty', 'username department profileImage')
            .populate('user', 'username department profileImage');

        // Group by evaluator
        const evaluatorsMap = {};
        subjects.forEach(subject => {
            const instructor = subject.faculty || subject.user;
            if (!instructor?._id) return;

            const id = instructor._id.toString();
            const type = subject.faculty ? 'faculty' : 'programchair';

            if (!evaluatorsMap[id]) {
                evaluatorsMap[id] = {
                    _id: id,
                    name: instructor.username || 'Unknown',
                    type,
                    department: instructor.department || department,
                    subjects: [],
                };
            }

            evaluatorsMap[id].subjects.push({ _id: subject._id, title: subject.title });
        });

        const evaluators = Object.values(evaluatorsMap);

        res.json({
            faculty: evaluators.filter(e => e.type === 'faculty'),
            programChairs: evaluators.filter(e => e.type === 'programchair'),
            total: evaluators.length,
        });
    } catch (error) {
        console.error('Error fetching evaluators:', error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;