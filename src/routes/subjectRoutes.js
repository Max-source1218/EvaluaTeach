import express from "express";
import Subject from "../models/Subject.js";
import protectRoute from "../middleware/auth.middleware.js";
import protectRouteStudent from "../middleware/student.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
    
    try{
    const {title, semester, schoolyear, instructorId} = req.body;

    if(!title || !semester || !schoolyear || !instructorId) return res.status(400).json({message: "Please provide all details"})

    const newSubject = new Subject({
        title,
        semester,
        schoolyear,
        instructorId
    });
    await newSubject.save();
    console.log("DB save success");

    res.status(201).json({newSubject});

    }catch(err){
        console.log("Error creating subject for instructor: ", err.message)
        console.log("Full Error:", err)
        res.status(500).json({message: err.message})
    }
});

router.get("/user", protectRouteStudent, async (request, response) => {
    try {
        const subjects = await Subject.find({ user: request.user._id }).sort({ createdAt: -1 });
        response.json(subjects);
    } catch (error) {
        console.error("Get user Evaluation form error", error.message);
        response.status(500).json({ message: "Server error" });
    }
});

router.delete("/:id", protectRoute, async (request, response) => {
    try{
        const subject = await Subject.findById(request.params.id);
        if(!subject) return response.status(404).json({message: "Subject for instructor not found"});

        if(subject.user.toString() !== request.user._id.toString()) return response.status(401).json({message: "Unauthorized"});

        await instructor.deleteOne();

        response.json({message: "Subject deleted successfully"});

    }catch(error){
        console.log("Error deleting subject", error)
        response.status(500).json({message: "Internal server error"})
    }
});
export default router;