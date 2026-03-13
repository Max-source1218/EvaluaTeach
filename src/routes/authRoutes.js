import express from 'express';
import User from "../models/User.js";
import generateToken from "../lib/generateToken.js";

const router = express.Router();

router.post("/register", async (request, response) => {
    try {
        const { email, username, password, role } = request.body;

        if (!email || !username || !password || !role)
            return response.status(400).json({ message: "All fields are required" });

        if (password.length < 6)
            return response.status(400).json({ message: "Password must be at least 6 characters" });

        if (username.length < 3)
            return response.status(400).json({ message: "Username must be at least 3 characters" });

        if (!['Program Chair', 'Supervisor'].includes(role))
            return response.status(400).json({ message: "Invalid role selected" });

        if (await User.findOne({ email }))
            return response.status(400).json({ message: "Email already exists" });

        if (await User.findOne({ username }))
            return response.status(400).json({ message: "Username already exists" });

        const user = new User({
            email, username, password, role,
            profileImage: "https://api.dicebear.com/9.x/avataaars/svg?seed=George",
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
        console.error("Error in register route:", error.message);
        response.status(500).json({ message: "Internal server error" });
    }
});

router.post("/login", async (request, response) => {
    try {
        const { email, password } = request.body;

        if (!email || !password)
            return response.status(400).json({ message: "All fields are required" });

        const user = await User.findOne({ email });
        if (!user)
            return response.status(400).json({ message: "User not found" });

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect)
            return response.status(400).json({ message: "Wrong password" });

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
        console.error("Error in login route:", error.message);
        response.status(500).json({ message: "Internal server error" });
    }
});

export default router;