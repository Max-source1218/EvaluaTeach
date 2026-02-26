// routes/supervisorDetailRoutes.js
import express from 'express';
import SupervisorForm from '../models/SupervisorForm.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// Save or update Program Chair details
router.post('/', protectRoute, async (req, res) => {
    try {
        const { name, department, schoolyear, semester, role } = req.body;
        const userId = req.user._id;

        if (!department || !schoolyear || !semester || !role) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        // Check if already exists
        let existingForm = await SupervisorForm.findOne({ user: userId });

        if (existingForm) {
            // Update existing
            existingForm.name = name || existingForm.name;
            existingForm.department = department;
            existingForm.schoolyear = schoolyear;
            existingForm.semester = semester;
            existingForm.role = role;
            
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
                role,
            });

            await newForm.save();
            res.status(201).json({ message: 'Details saved successfully', form: newForm });
        }
    } catch (error) {
        console.error('Error saving supervisor form:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get current user's (Program Chair/Supervisor) details
router.get('/', protectRoute, async (req, res) => {
    try {
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