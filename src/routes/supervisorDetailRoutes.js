import express from 'express';
import SupervisorForm from '../models/SupervisorForm.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// Save or update Supervisor/Program Chair details
router.post('/', protectRoute, async (req, res) => {
    try {
        const { name, department, schoolyear, semester, role } = req.body;

        if (!req.user?._id)
            return res.status(401).json({ message: 'User not authenticated properly' });

        if (!department || !schoolyear || !semester)
            return res.status(400).json({ message: 'All required fields must be filled' });

        const userRole = role || req.user.role || 'Supervisor';

        // ✅ Atomic upsert — no race condition
        const form = await SupervisorForm.findOneAndUpdate(
            { user: req.user._id },
            { name: name || '', department, schoolyear, semester, role: userRole },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ message: 'Details saved successfully', form });
    } catch (error) {
        console.error('Error saving supervisor form:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Get current user's details
router.get('/', protectRoute, async (req, res) => {
    try {
        if (!req.user?._id)
            return res.status(401).json({ message: 'User not authenticated properly' });

        const form = await SupervisorForm.findOne({ user: req.user._id });
        if (!form)
            return res.status(404).json({ message: 'No details found' });

        res.json(form);
    } catch (error) {
        console.error('Error fetching supervisor form:', error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;