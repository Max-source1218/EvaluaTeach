// models/FacultyResult.js
import mongoose from "mongoose";

// This is a virtual/computed model - we don't actually store data
// We just use it to structure the combined results from both evaluation types

const facultyResultSchema = new mongoose.Schema({
    // This schema is for reference only - data is computed on-the-fly
    _id: mongoose.Schema.Types.ObjectId,
    evaluatorName: String,
    semester: String,
    schoolyear: String,
    department: String,
    title: String,
    points: Number,
    evaluatorType: {
        type: String,
        enum: ['programchair', 'student']
    }
}, { 
    timestamps: true,
    _id: false 
});

// Static method to get combined evaluation results
facultyResultSchema.statics.getFacultyResults = async function(facultyId, schoolyear, subject) {
    const Faculty_Evaluation = (await import('./Faculty_Evaluation.js')).default;
    const StudentEvaluation = (await import('./Student_Evaluation.js')).default;

    // Get evaluations from Program Chairs
    const programChairEvals = await Faculty_Evaluation.find({
        facultyId,
        ...(schoolyear && { schoolyear }),
        ...(subject && { title: subject })
    }).populate('userId', 'username');

    // Get evaluations from Students
    const studentEvals = await StudentEvaluation.find({
        evaluatorId: facultyId,
        evaluatorType: 'faculty',
        ...(schoolyear && { schoolyear }),
        ...(subject && { title: subject })
    }).populate('userId', 'username');

    // Combine and format
    return [
        ...programChairEvals.map(e => ({
            _id: e._id,
            evaluatorName: e.userId?.username || 'Unknown Program Chair',
            semester: e.semester,
            schoolyear: e.schoolyear,
            department: e.department,
            title: e.title,
            points: e.points,
            evaluatorType: 'programchair'
        })),
        ...studentEvals.map(e => ({
            _id: e._id,
            evaluatorName: e.name || 'Anonymous Student',
            semester: e.semester,
            schoolyear: e.schoolyear,
            department: e.department,
            title: e.title,
            points: e.points,
            evaluatorType: 'student'
        }))
    ];
};

const FacultyResult = mongoose.model("FacultyResult", facultyResultSchema);

export default FacultyResult;