import mongoose from "mongoose";

const studentEvaluationSchema = new mongoose.Schema({
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
    // Can be either Faculty OR Program Chair
    evaluatorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    evaluatorType: {
        type: String,
        required: true,
        enum: ['faculty', 'programchair'],
    },
    // Student who submitted the evaluation
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student', 
        required: true,
    },
    department: {
        type: String,
        required: true,
        enum: ['CCIT', 'CTE', 'CBAPA'],
    },
    // Student's name from Student_Detail
    name: { 
        type: String,
        required: true,
    },
    points: { 
        type: Number,
        required: true,
    },
}, { timestamps: true });

// Index for faster queries
studentEvaluationSchema.index({ evaluatorId: 1, schoolyear: 1, semester: 1 });
studentEvaluationSchema.index({ userId: 1 });

const StudentEvaluation = mongoose.model("StudentEvaluation", studentEvaluationSchema);
export default StudentEvaluation;