import mongoose from "mongoose";

const studentEvaluationSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
    },
    evaluatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Can be Faculty or Program Chair
        required: true,
    },
    evaluatorType: {
        type: String,
        required: true,
        enum: ['faculty', 'programChair'], // ✅ Important!
    },
    schoolyear: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    semester: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    points: {
        type: Number,
        required: true,
    },
    comments: {
        type: String,
    },
}, { timestamps: true });

const Student_Evaluation = mongoose.model("Student_Evaluation", studentEvaluationSchema);
export default Student_Evaluation;