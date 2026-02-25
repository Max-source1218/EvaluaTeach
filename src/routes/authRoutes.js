import express from 'express';
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({ _id: userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

router.post("/register", async (request, response) => {
    try {
        const { email, username, password, role } = request.body;

        if (!email || !username || !password || !role) {
            return response.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return response.status(400).json({ message: "Password should be at least 6 characters long" });
        }

        if (username.length < 3) {
            return response.status(400).json({ message: "Username should be at least 3 characters long" });
        }

        if (!['Program Chair', 'Supervisor'].includes(role)) {
            return response.status(400).json({ message: "Invalid role selected" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return response.status(400).json({ message: "User ID already exists" });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return response.status(400).json({ message: "Username already exists" });
        }

        const profileImage = "https://api.dicebear.com/9.x/avataaars/svg?seed=George";

        const user = new User({
            email,
            username,
            password,
            profileImage,
            role,
        });

        await user.save();

        const token = generateToken(user._id);

        response.status(201).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                role: user.role,
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

        const user = await User.findOne({ email });
        if (!user) return response.status(400).json({ message: "User not found" });

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) return response.status(400).json({ message: "Wrong Password" });

        const token = generateToken(user._id);

        response.status(200).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                role: user.role,
                createdAt: user.createdAt,
            },
        });

    } catch (error) {
        console.log("Error in login route", error);
        response.status(500).json({ message: "Internal server error" });
    }
});

export default router;