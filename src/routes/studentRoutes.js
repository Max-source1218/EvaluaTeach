import express from 'express';
import Student from "../models/Student.js";
import generateToken from "../lib/generateToken.js";

const router = express.Router();

router.post("/register", async (request, response) => {
    try {
        const { email, username, password } = request.body;

        if (!email || !username || !password)
            return response.status(400).json({ message: "All fields are required" });

        if (password.length < 6)
            return response.status(400).json({ message: "Password must be at least 6 characters" });

        if (username.length < 3)
            return response.status(400).json({ message: "Username must be at least 3 characters" });

        if (await Student.findOne({ email }))
            return response.status(400).json({ message: "Email already exists" });

        if (await Student.findOne({ username }))
            return response.status(400).json({ message: "Username already exists" });

        const student = new Student({
            email, username, password,
            profileImage: "https://api.dicebear.com/9.x/avataaars/svg?seed=George",
        });

        await student.save();
        const token = generateToken(student._id);

        response.status(201).json({
            token,
            student: {
                _id: student._id,        // ✅ consistent _id
                username: student.username,
                email: student.email,
                profileImage: student.profileImage,
            },
        });
    } catch (error) {
        console.error("Error in student register route:", error.message);
        response.status(500).json({ message: "Internal server error" });
    }
});

router.post("/login", async (request, response) => {
    try {
        const { email, password } = request.body;

        if (!email || !password)
            return response.status(400).json({ message: "All fields are required" });

        const student = await Student.findOne({ email });
        if (!student)
            return response.status(400).json({ message: "User not found" }); // ✅ fixed message

        const isPasswordCorrect = await student.comparePassword(password);
        if (!isPasswordCorrect)
            return response.status(400).json({ message: "Wrong password" });

        const token = generateToken(student._id);

        response.status(200).json({
            token,
            student: {
                _id: student._id,        // ✅ consistent _id
                username: student.username,
                email: student.email,
                profileImage: student.profileImage,
                createdAt: student.createdAt,
            },
        });
    } catch (error) {
        console.error("Error in student login route:", error.message);
        response.status(500).json({ message: "Internal server error" });
    }
});

export default router;