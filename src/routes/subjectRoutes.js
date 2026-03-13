import express from 'express';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import Faculty from '../models/Faculty.js';
import protectRoute from '../middleware/auth.middleware.js';
import combinedAuth from '../middleware/combinedAuth.middleware.js';

const router = express.Router();

// ─── CREATE SUBJECT ────────────────────────────────────────────────────────
router.post('/', protectRoute, async (req, res) => {
    try {
        const { title, semester, schoolyear, department, instructorId } = req.body;

        if (!title || !semester || !schoolyear || !department || !instructorId)
            return res.status(400).json({ message: 'All fields are required' });

        // ✅ Check both collections in parallel instead of sequentially
        const [user, faculty] = await Promise.all([
            User.findById(instructorId),
            Faculty.findById(instructorId),
        ]);

        if (!user && !faculty)
            return res.status(404).json({ message: 'Instructor not found' });

        const newSubject = new Subject({
            title,
            semester,
            schoolyear,
            department,
            // ✅ Set the correct field based on which collection matched
            ...(user    ? { user:    instructorId } : {}),
            ...(faculty ? { faculty: instructorId } : {}),
        });

        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET SUBJECTS FOR LOGGED-IN USER (Program Chair / Supervisor) ──────────
router.get('/user', protectRoute, async (req, res) => {
    try {
        const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET SUBJECTS FOR A FACULTY ────────────────────────────────────────────
// ✅ Fixed: was protectRouteStudent — PC/Supervisor also call this via SubjectInputForm
router.get('/faculty/:facultyId', combinedAuth, async (req, res) => {
    try {
        const subjects = await Subject.find({ faculty: req.params.facultyId }).sort({ createdAt: -1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── DELETE SUBJECT ────────────────────────────────────────────────────────
router.delete('/:id', protectRoute, async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject)
            return res.status(404).json({ message: 'Subject not found' });

        // ✅ Fixed: check both subject.user AND subject.faculty for ownership
        const ownerId = subject.user ?? subject.faculty;
        if (!ownerId || ownerId.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Unauthorized' });

        await Subject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ─── FILTER SUBJECTS ───────────────────────────────────────────────────────
router.get('/filter', protectRoute, async (req, res) => {
    try {
        const { schoolyear, semester, department, type } = req.query;

        if (!schoolyear || !semester || !department)
            return res.status(400).json({ message: 'schoolyear, semester and department are required' });

        const baseFilter = { schoolyear, semester, department };

        // ✅ Filter by type if provided — avoids mixing faculty + user results
        let subjects;
        if (type === 'faculty') {
            subjects = await Subject.find({ ...baseFilter, faculty: { $exists: true, $ne: null } })
                .populate('faculty', 'username department profileImage');
        } else if (type === 'programchair') {
            subjects = await Subject.find({ ...baseFilter, user: { $exists: true, $ne: null } })
                .populate('user', 'username department profileImage');
        } else {
            // No type — return both
            subjects = await Subject.find(baseFilter)
                .populate('faculty', 'username department profileImage')
                .populate('user',    'username department profileImage');
        }

        // Group by instructor
        const instructorsMap = {};
        subjects.forEach(subject => {
            const instructor = subject.faculty || subject.user;
            if (!instructor) return;

            const id = instructor._id.toString();
            if (!instructorsMap[id]) {
                instructorsMap[id] = {
                    _id:          id,
                    name:         instructor.username || 'Unknown',
                    department:   instructor.department || department,
                    profileImage: instructor.profileImage,
                    subjects:     [],
                };
            }
            instructorsMap[id].subjects.push({ _id: subject._id, title: subject.title });
        });

        res.json({ instructors: Object.values(instructorsMap) });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/all', protectRoute, async (req, res) => {
    try {
        const subjects = await Subject.find()
            .populate('faculty', 'username department')
            .populate('user',    'username department')
            .sort({ title: 1 });

        // ✅ Group by subject title — one card per unique subject name
        const groupedMap = {};
        subjects.forEach(subject => {
            const key = subject.title;
            if (!groupedMap[key]) {
                groupedMap[key] = {
                    // ✅ Use first subject's _id as stable key for FlatList
                    _id:       subject._id,
                    subject:   subject.title,
                    creators:  [],
                };
            }

            const instructor = subject.faculty || subject.user;
            if (instructor) {
                groupedMap[key].creators.push({
                    name: instructor.username || 'Unknown',
                    role: subject.faculty ? 'Faculty' : 'Program Chair',
                });
            }
        });

        res.json(Object.values(groupedMap));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
export default router;