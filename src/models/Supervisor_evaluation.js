import mongoose from "mongoose";

const supervisor_evaluationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    semester: {
        type: String,
        required: true,
        enum: ['1st Semester', '2nd Semester'],
    },
    schoolyear: {
        type: String,
        required: true,
        enum: ['2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027', '2027-2028'],
    },
    // Fixed: Reference 'User' instead of 'Instructor'
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Program Chairs are stored in User model
        required: true,
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Supervisor is also in User model
        required: true,
    },
    department: {
        type: String,
        required: true,
        enum: ['CCIT', 'CTE', 'CBAPA'],
    },
    name: { 
        type: String,
        required: true,
    },
    points: { 
        type: Number,
        required: true,
    },
}, { timestamps: true });

// ✅ Fix: Check if model already exists before creating
const Supervisor_Evaluation = mongoose.models.Supervisor_Evaluation || mongoose.model("Supervisor_Evaluation", supervisor_evaluationSchema);

export default Supervisor_Evaluation;