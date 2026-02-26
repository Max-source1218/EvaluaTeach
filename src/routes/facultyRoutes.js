import express from 'express';
import Faculty from "../models/Faculty.js";
import jwt from "jsonwebtoken";
import protectRoute from "../middleware/auth.middleware.js";
import cloudinary from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Multer for handling multipart/form-data
const upload = multer({ storage: multer.memoryStorage() });

const generateToken = (userId) => {
    return jwt.sign({ _id: userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
            { folder: 'faculty_profiles' },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// Register Faculty (Admin only)
router.post("/register", protectRoute, upload.single('profileImage'), async (request, response) => {
    try {
        const { email, username, password, department } = request.body;

        if (!email || !username || !password || !department) {
            return response.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return response.status(400).json({ message: "Password should be at least 6 characters long" });
        }

        if (username.length < 3) {
            return response.status(400).json({ message: "Username should be at least 3 characters long" });
        }

        const validDepartments = ['CCIT', 'CTE', 'CBAPA'];
        if (!validDepartments.includes(department)) {
            return response.status(400).json({ message: "Invalid department selected" });
        }

        const existingEmail = await Faculty.findOne({ email });
        if (existingEmail) {
            return response.status(400).json({ message: "Email already exists" });
        }

        const existingUsername = await Faculty.findOne({ username });
        if (existingUsername) {
            return response.status(400).json({ message: "Username already exists" });
        }

        let profileImage = "https://api.dicebear.com/9.x/avataaars/svg?seed=George";

        // Upload image to Cloudinary if provided
        if (request.file) {
            try {
                console.log('=== UPLOADING TO CLOUDINARY ===');
                profileImage = await uploadToCloudinary(request.file.buffer);
                console.log('Cloudinary URL:', profileImage);
            } catch (cloudinaryError) {
                console.error('Cloudinary upload error:', cloudinaryError);
                return response.status(500).json({ message: "Failed to upload image" });
            }
        }

        const faculty = new Faculty({
            email,
            username,
            password,
            profileImage,
            department,
        });

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
        console.log("Error in register route", error);
        response.status(500).json({ message: "Internal server error" });
    }
});

// Faculty Login
router.post("/login", async (request, response) => {
    try {
        const { email, password } = request.body;

        if (!email || !password) return response.status(400).json({ message: "All fields are required" });

        const faculty = await Faculty.findOne({ email });
        if (!faculty) return response.status(400).json({ message: "User not found" });

        const isPasswordCorrect = await faculty.comparePassword(password);
        if (!isPasswordCorrect) return response.status(400).json({ message: "Wrong Password" });

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
        console.log("Error in login route", error);
        response.status(500).json({ message: "Internal server error" });
    }
});

// Get all faculty members (Admin only)
router.get("/all", protectRoute, async (request, response) => {
    try {
        const faculty = await Faculty.find().select('-password');
        response.json(faculty);
    } catch (error) {
        console.log("Error fetching faculty:", error);
        response.status(500).json({ message: "Server error" });
    }
});

// Get faculty by ID
router.get("/:id", protectRoute, async (request, response) => {
    try {
        const faculty = await Faculty.findById(request.params.id).select('-password');
        if (!faculty) {
            return response.status(404).json({ message: "Faculty not found" });
        }
        response.json(faculty);
    } catch (error) {
        console.log("Error fetching faculty:", error);
        response.status(500).json({ message: "Server error" });
    }
});

// Update faculty
router.put("/:id", protectRoute, async (request, response) => {
    try {
        const { username, email, department } = request.body;
        
        const faculty = await Faculty.findByIdAndUpdate(
            request.params.id,
            { username, email, department },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!faculty) {
            return response.status(404).json({ message: "Faculty not found" });
        }
        
        response.json(faculty);
    } catch (error) {
        console.log("Error updating faculty:", error);
        response.status(500).json({ message: "Server error" });
    }
});

// Delete faculty
router.delete("/:id", protectRoute, async (request, response) => {
    try {
        const faculty = await Faculty.findByIdAndDelete(request.params.id);
        if (!faculty) {
            return response.status(404).json({ message: "Faculty not found" });
        }
        response.json({ message: "Faculty deleted successfully" });
    } catch (error) {
        console.log("Error deleting faculty:", error);
        response.status(500).json({ message: "Server error" });
    }
});

export default router;  