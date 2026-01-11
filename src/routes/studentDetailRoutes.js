import express from "express";
import Student_Detail from "../models/StudentForm.js";
import protectRouteStudent from "../middleware/student.middleware.js";

const router = express.Router();

router.post("/", protectRouteStudent, async (req, res) => {
    try {
        const { name, department, course, year_level, schoolyear, semester } = req.body;

        if (!department || !course || !year_level || !schoolyear || !semester) {
            return res.status(400).json({ message: "Please provide all required details" });
        }

        const newForm = new Student_Detail({
            name,
            department,
            course,
            year_level,
            schoolyear,
            semester,
            user: req.user._id, // Added: Associate with logged-in user
        });
        await newForm.save();
        console.log("DB save success");

        res.status(201).json({ newForm });
    } catch (err) {
        console.log("Error creating student detail: ", err.message);
        console.log("Full Error:", err);
        res.status(500).json({ message: err.message });
    }
});

router.get("/user", protectRouteStudent, async (request, response) => {
    try {
        const studentForm = await Student_Detail.find({ user: request.user._id }).sort({ createdAt: -1 });
        response.json(studentForm);
    } catch (error) {
        console.error("Get student details error", error.message);
        response.status(500).json({ message: "Server error" });
    }
});

export default router;