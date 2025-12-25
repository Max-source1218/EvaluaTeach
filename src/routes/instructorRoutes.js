import express, { request } from "express";
import cloudinary from "../lib/cloudinary.js";
import Instructor from "../models/Instructor.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (request, response) => {

    try{
        const {name, department, image} = request.body;

        if (!image || !name || !department) return response.status(400).json({message: "Please provide all fields"});

        // Upload the image to cloudinary
         const uploadResponse = await cloudinary.uploader.upload(image);
         const imageURL = uploadResponse.secure_url;
        // Save to the database

        const newInstructor = new Instructor({
            name,
            department,
            image: imageURL,
            user: request.user._id,
        });

        await newInstructor.save();

        response.status(201).json({newInstructor})
    }catch(error){
        console.log("Error listing student")
        response.status(500).json({message: error.message})
    }
});

// const response = await fetch("https://localhost:3000/api/students?page=1&limit=5");

router.get("/", protectRoute, async (request, response) => {
    try{
        const page = request.query.page || 1;
        const limit = request.query.limit || 5;
        const skip = (page - 1) * limit;
        
        const instructors = await Instructor.find().sort({createdAt: -1}).skip(skip).limit(limit).populate("user", "username profileImage");

        const totalInstructors = await Student.countDocuments();

        response.send({
            instructors,
            currentPage: page,
            totalInstructors,
            totalPages: Math.ceil(totalStudents / limit),
        });

    }catch(error){
        console.log("Error in fetching instructor", error);
        response.status(500).json({message: "Internal server error"})
    }
});

router.get("/user", protectRoute, async (request, response) => {
    try{
        const instructors = (await Instructor.find({user: request.user._id})).toSorted({createdAt: -1});
        response.json(instructors);
    }catch(error){
        console.error("Get user Evaluation form error", error.message);
        response.status(500).json({message: "Server error"});
    }
});

router.delete("/:id", protectRoute, async (request, response) => {
    try{
        const instructor = await Instructor.findById(request.params.id);
        if(!instructor) return response.status(404).json({message: "Instructor not found"});

        if(instructor.user.toString() !== request.user._id.toString()) return response.status(401).json({message: "Unauthorized"});

        //Delete image from Cloudinary

        if (instructor.image && instructor.image.includes("cloudinary")){
            try{
                const publicId = instructor.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);

            }catch(deleteError){
                console.log("Error deleting image from cloudinary", deleteError);

            }
        }

        await instructor.deleteOne();

        response.json({message: "Student deleted successfully"});

    }catch(error){
        console.log("Error deleting instructor", error)
        response.status(500).json({message: "Internal server error"})
    }
});
export default router;