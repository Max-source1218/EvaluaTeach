import express from 'express';
import SupervisorForm from '../models/SupervisorForm.js';
import User from '../models/User.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// Save or update Program Chair/Supervisor details
router.post('/', protectRoute, async (req, res) => {
    try {
        console.log('=== POST /supervisor-detail ===');
        console.log('req.user:', req.user);
        console.log('req.body:', req.body);

        const { name, department, schoolyear, semester, role } = req.body;

        // ✅ Safe access to req.user
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not authenticated properly' });
        }

        const userId = req.user._id;

        if (!department || !schoolyear || !semester) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        // ✅ Get role from body OR from user model
        let userRole = role;
        if (!userRole) {
            userRole = req.user.role || 'Supervisor';
        }

        console.log('Saving with userId:', userId, 'role:', userRole);

        // Check if already exists
        let existingForm = await SupervisorForm.findOne({ user: userId });

        if (existingForm) {
            // Update existing
            existingForm.name = name || existingForm.name;
            existingForm.department = department;
            existingForm.schoolyear = schoolyear;
            existingForm.semester = semester;
            existingForm.role = userRole;
            
            await existingForm.save();
            res.status(200).json({ message: 'Details updated successfully', form: existingForm });
        } else {
            // Create new
            const newForm = new SupervisorForm({
                user: userId,
                name: name || '',
                department,
                schoolyear,
                semester,
                role: userRole,
            });

            await newForm.save();
            res.status(201).json({ message: 'Details saved successfully', form: newForm });
        }
    } catch (error) {
        console.error('Error saving supervisor form:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get current user's details
router.get('/', protectRoute, async (req, res) => {
    try {
        console.log('=== GET /supervisor-detail ===');
        console.log('req.user:', req.user);

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not authenticated properly' });
        }

        const userId = req.user._id;
        const form = await SupervisorForm.findOne({ user: userId });

        if (!form) {
            return res.status(404).json({ message: 'No details found' });
        }

        res.json(form);
    } catch (error) {
        console.error('Error fetching supervisor form:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;