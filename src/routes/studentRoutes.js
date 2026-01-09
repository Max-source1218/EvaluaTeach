import express from 'express';
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({ _id: userId }, process.env.JWT_SECRET, { expiresIn: "15d" }); 
};

router.post("/register", async (request, response) => {
    try {
        const { email, username, password } = request.body;

        if (!email || !username || !password) {
            return response.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return response.status(400).json({ message: "Password should be at least 6 characters long" });
        }

        if (username.length < 3) {
            return response.status(400).json({ message: "Username should be at least 3 characters long" });
        }

        const existingEmail = await Student.findOne({ email });
        if (existingEmail) {
            return response.status(400).json({ message: "User ID already exists" });
        }

        const existingUsername = await Student.findOne({ username });
        if (existingUsername) {
            return response.status(400).json({ message: "Username already exists" });
        }

        const profileImage = "https://api.dicebear.com/9.x/avataaars/svg?seed=George";

        const student = new Student({
            email,
            username,
            password,
            profileImage,
        });

        await student.save();

        const token = generateToken(student._id); // Now uses '_id'

        response.status(201).json({
            token,
            student: {
                _id: student._id,
                username: student.username,
                email: student.email,
                profileImage: student.profileImage,
            },
        });
    } catch (error) {
        console.log("Error in register route", error);
        response.status(500).json({ message: "Internal server error" });
    }
});

router.post("/login", async (request, response) => {
    try {
        const { email, password } = request.body;

        if (!email || !password) return response.status(400).json({ message: "All fields are required" });

        const student = await Student.findOne({ email });
        if (!student) return response.status(400).json({ message: "This username is not found" }); // Note: Message says "username" but checks email—consider updating to "User not found"

        const isPasswordCorrect = await student.comparePassword(password);
        if (!isPasswordCorrect) return response.status(400).json({ message: "Wrong Password" });

        const token = generateToken(student._id); // Now uses '_id'

        response.status(200).json({
            token,
            student: {
                id: student._id, // Note: 'id' instead of '_id'—keep consistent if needed
                username: student.username,
                email: student.email,
                profileImage: student.profileImage,
                createdAt: student.createdAt,
            },
        });

    } catch (error) {
        console.log("Error in login route", error);
        response.status(500).json({ message: "Internal server error" });
    }
});

export default router;