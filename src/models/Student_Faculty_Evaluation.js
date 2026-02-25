// models/Student_Faculty_Evaluation.js
import mongoose from "mongoose";

const student_faculty_evaluationSchema = new mongoose.Schema({
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
        ref: 'Faculty', // Faculty members are in Faculty model
        required: true,
    },
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
    name: { 
        type: String,
        required: true,
    },
    points: { 
        type: Number,
        required: true,
    },
}, { timestamps: true });

const Student_Faculty_Evaluation = mongoose.model("Student_Faculty_Evaluation", student_faculty_evaluationSchema);
export default Student_Faculty_Evaluation;