import express from 'express';
import Faculty from "../models/Faculty.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Updated: Use '_id' in payload to match protectRoute's expectation
const generateToken = (userId) => {
    return jwt.sign({ _id: userId }, process.env.JWT_SECRET, { expiresIn: "15d" }); // Changed 'userId' to '_id'
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

        const existingEmail = await Faculty.findOne({ email });
        if (existingEmail) {
            return response.status(400).json({ message: "User ID already exists" });
        }

        const existingUsername = await Faculty.findOne({ username });
        if (existingUsername) {
            return response.status(400).json({ message: "Username already exists" });
        }

        const profileImage = "https://api.dicebear.com/9.x/avataaars/svg?seed=George";

        const faculty = new Faculty({
            email,
            username,
            password,
            profileImage,
        });

        await faculty.save();

        const token = generateToken(faculty._id); 

        response.status(201).json({
            token,
            faculty: {
                _id: faculty._id,
                username: faculty.username,
                email: faculty.email,
                profileImage: faculty.profileImage,
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

        const faculty = await Faculty.findOne({ email });
        if (!faculty) return response.status(400).json({ message: "This username is not found" }); // Note: Message says "username" but checks email—consider updating to "User not found"

        const isPasswordCorrect = await faculty.comparePassword(password);
        if (!isPasswordCorrect) return response.status(400).json({ message: "Wrong Password" });

        const token = generateToken(faculty._id); // Now uses '_id'

        response.status(200).json({
            token,
            student: {
                id: faculty._id, // Note: 'id' instead of '_id'—keep consistent if needed
                username: faculty.username,
                email: faculty.email,
                profileImage: faculty.profileImage,
                createdAt: faculty.createdAt,
            },
        });

    } catch (error) {
        console.log("Error in login route", error);
        response.status(500).json({ message: "Internal server error" });
    }
});

export default router;