import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema({
    title: { // Referencing 'title' from the Subject schema
        type: String,
        required: true,
    },
    semester: { // Referencing 'semester' from the Student_Detail schema
        type: String,
        required: true,
        enum: ['1st Semester', '2nd Semester'],
    },
    schoolyear: { // Referencing 'schoolyear' from the Student_Detail schema
        type: String,
        required: true,
        enum: ['2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027', '2027-2028'],
    },
    instructorId: { // Refs Instructor to access 'name' and 'department'
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
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
        enum: ['CCIT', 'CTE', 'CBAPA'], // Corrected enum
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

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

export default Evaluation;