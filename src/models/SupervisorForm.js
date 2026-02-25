import mongoose from "mongoose";

const supervisorFormSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
        enum: ['CCIT', 'CTE', 'CBAPA'],
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
    role: {
        type: String,
        enum: ['Program Chair', 'Supervisor'],
        required: true,
    },
}, { timestamps: true });

const SupervisorForm = mongoose.model("SupervisorForm", supervisorFormSchema);
export default SupervisorForm;