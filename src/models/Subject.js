import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
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
    },
    // Can reference either User (Program Chair/Supervisor) or Faculty
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
    },
}, { timestamps: true });

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;