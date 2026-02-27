// models/ProgramChairResult.js
import mongoose from "mongoose";

// This is a virtual/computed model - we don't actually store data
// We just use it to structure the combined results from both evaluation types

const programChairResultSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    evaluatorName: String,
    semester: String,
    schoolyear: String,
    department: String,
    title: String,
    points: Number,
    evaluatorType: {
        type: String,
        enum: ['supervisor', 'student']
    }
}, { 
    timestamps: true,
    _id: false 
});

const ProgramChairResult = mongoose.model("ProgramChairResult", programChairResultSchema);

export default ProgramChairResult;