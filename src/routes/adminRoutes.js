// Add these routes to your adminRoutes.js or create new file

import express from 'express';
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all Program Chairs (for Supervisors to see)
// adminRoutes.js

// Get all Program Chairs (for Supervisors)
router.get("/program-chairs", protectRoute, async (req, res) => {
    try {
        const programChairs = await User.find({ role: 'Program Chair' }).select('-password');
        res.json(programChairs);
    } catch (error) {
        console.log("Error fetching program chairs:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all Faculty (for Program Chairs)
router.get("/faculty", protectRoute, async (req, res) => {
    try {
        const faculty = await Faculty.find().select('-password');
        res.json(faculty);
    } catch (error) {
        console.log("Error fetching faculty:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;