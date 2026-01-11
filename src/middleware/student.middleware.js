import jwt from "jsonwebtoken";
import Student from "../models/Student.js"; // Ensure this model exists

const protectRouteStudent = async (request, response, next) => {
    try {
        // Get Token (safely handle missing header)
        const authHeader = request.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "No authentication token, access denied" });
        }
        const token = authHeader.replace("Bearer ", "");

        // Verify token (ensure secret matches student login)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find student (use Student model)
        const student = await Student.findById(decoded._id).select("-password");
        if (!student) {
            return response.status(401).json({ message: "Token is not valid" });
        }

        request.user = student; // Set to student
        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        response.status(401).json({ message: "Token is not valid" });
    }
};

export default protectRouteStudent;