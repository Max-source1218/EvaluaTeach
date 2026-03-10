import express from 'express';
import Faculty from "../models/Faculty.js";
import generateToken from "../lib/generateToken.js";
import protectRoute from "../middleware/auth.middleware.js";
import cloudinary from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
            { folder: 'faculty_profiles' },
            (error, result) => error ? reject(error) : resolve(result.secure_url)
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// ✅ Allow both Supervisor and Program Chair to register faculty
const requireSupervisorOrChair = (req, res, next) => {
    if (req.user.role !== 'Supervisor' && req.user.role !== 'Program Chair') {
        return res.status(403).json({ message: "Access denied - Supervisors and Program Chairs only" });
    }
    next();
};

// Register Faculty — Supervisor only
router.post("/register", protectRoute, requireSupervisor, upload.single('profileImage'), async (request, response) => {
    try {
        const { email, username, password, department } = request.body;

        if (!email || !username || !password || !department)
            return response.status(400).json({ message: "All fields are required" });

        if (password.length < 6)
            return response.status(400).json({ message: "Password must be at least 6 characters" });

        if (username.length < 3)
            return response.status(400).json({ message: "Username must be at least 3 characters" });

        if (!['CCIT', 'CTE', 'CBAPA'].includes(department))
            return response.status(400).json({ message: "Invalid department selected" });

        if (await Faculty.findOne({ email }))
            return response.status(400).json({ message: "Email already exists" });

        if (await Faculty.findOne({ username }))
            return response.status(400).json({ message: "Username already exists" });

        let profileImage = "https://api.dicebear.com/9.x/avataaars/svg?seed=George";

        if (request.file) {
            try {
                profileImage = await uploadToCloudinary(request.file.buffer);
            } catch (cloudinaryError) {
                console.error('Cloudinary upload error:', cloudinaryError);
                return response.status(500).json({ message: "Failed to upload image" });
            }
        }

        const faculty = new Faculty({ email, username, password, profileImage, department });
        await faculty.save();

        response.status(201).json({
            message: "Faculty registered successfully",
            faculty: {
                _id: faculty._id,
                username: faculty.username,
                email: faculty.email,
                profileImage: faculty.profileImage,
                department: faculty.department,
            },
        });
    } catch (error) {
        console.error("Error in faculty register route:", error.message);
        response.status(500).json({ message: "Internal server error" });
    }
});

// Faculty Login — public
router.post("/login", async (request, response) => {
    try {
        const { email, password } = request.body;

        if (!email || !password)
            return response.status(400).json({ message: "All fields are required" });

        const faculty = await Faculty.findOne({ email });
        if (!faculty)
            return response.status(400).json({ message: "User not found" });

        const isPasswordCorrect = await faculty.comparePassword(password);
        if (!isPasswordCorrect)
            return response.status(400).json({ message: "Wrong password" });

        const token = generateToken(faculty._id);

        response.status(200).json({
            token,
            faculty: {
                _id: faculty._id,
                username: faculty.username,
                email: faculty.email,
                profileImage: faculty.profileImage,
                department: faculty.department,
                createdAt: faculty.createdAt,
            },
        });
    } catch (error) {
        console.error("Error in faculty login route:", error.message);
        response.status(500).json({ message: "Internal server error" });
    }
});

// Get all faculty — Supervisor only
router.get("/all", protectRoute, requireSupervisor, async (request, response) => {
    try {
        const faculty = await Faculty.find().select('-password');
        response.json(faculty);
    } catch (error) {
        console.error("Error fetching faculty:", error.message);
        response.status(500).json({ message: "Server error" });
    }
});

// Get faculty by ID — Supervisor only
router.get("/:id", protectRoute, requireSupervisor, async (request, response) => {
    try {
        const faculty = await Faculty.findById(request.params.id).select('-password');
        if (!faculty)
            return response.status(404).json({ message: "Faculty not found" });
        response.json(faculty);
    } catch (error) {
        console.error("Error fetching faculty:", error.message);
        response.status(500).json({ message: "Server error" });
    }
});

// Update faculty — Supervisor only
router.put("/:id", protectRoute, requireSupervisor, async (request, response) => {
    try {
        const { username, email, department } = request.body;
        const faculty = await Faculty.findByIdAndUpdate(
            request.params.id,
            { username, email, department },
            { new: true, runValidators: true }
        ).select('-password');

        if (!faculty)
            return response.status(404).json({ message: "Faculty not found" });

        response.json(faculty);
    } catch (error) {
        console.error("Error updating faculty:", error.message);
        response.status(500).json({ message: "Server error" });
    }
});

// Delete faculty — Supervisor only
router.delete("/:id", protectRoute, requireSupervisor, async (request, response) => {
    try {
        const faculty = await Faculty.findByIdAndDelete(request.params.id);
        if (!faculty)
            return response.status(404).json({ message: "Faculty not found" });
        response.json({ message: "Faculty deleted successfully" });
    } catch (error) {
        console.error("Error deleting faculty:", error.message);
        response.status(500).json({ message: "Server error" });
    }
});

export default router;