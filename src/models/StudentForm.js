import mongoose from "mongoose";

const studentdetailSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
        enum: ['CCIT', 'CTE', 'CBAPA'],
    },
    course: {
        type: String,
        required: true,
        enum: ['Bachelor of Science in Computer Science', 'Bachelor of Education - Major in English', 'Bachelor of Education - Major in Social Studies', 'Bachelor of Education in Elementary Education', 'Bachelor of Science in Business Administration - Major in Human Resources'],
    },
    year_level: {
        type: String,
        required: true,
        enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'], 
    },
    schoolyear: {
        type: String,
        required: true,
        enum: ['2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027', '2027-2028'],
    },
    semester: {
        type: String,
        required: true,
        enum: ['1st Semester', '2nd Semester'], 
    },
    user: { // Added: Reference to the logged-in user
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student', // Assuming your user model is 'User'
        required: true,
    },
}, { timestamps: true });

const Student_Detail = mongoose.model("Student Detail", studentdetailSchema);

export default Student_Detail;