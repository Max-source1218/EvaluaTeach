import mongoose from "mongoose"; // This model collects the evaluation of the faculty user as the evaluation form is submitted

const facultyEvaluationSchema = new mongoose.Schema({
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
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Program Chair or Supervisor
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

const Faculty_Evaluation = mongoose.model("Faculty_Evaluation", facultyEvaluationSchema);
export default Faculty_Evaluation;