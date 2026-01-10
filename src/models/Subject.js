import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    semester: {
        type: String,
        required: true,
        enum: ['1st Semester', '2nd Semester'], // Optional: restrict to valid options
    },
    schoolyear: {
        type: String,
        required: true,
    },
    instructorId: { // Added: Link to instructor
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        required: true,
    },
}, { timestamps: true }); // Added timestamps

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;