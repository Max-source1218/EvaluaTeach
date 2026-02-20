import jwt from "jsonwebtoken";
import Faculty from "../models/Faculty.js"; // Ensure this model exists

const protectRouteFaculty = async (request, response, next) => {
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
        const faculty = await Faculty.findById(decoded._id).select("-password");
        if (!faculty) {
            return response.status(401).json({ message: "Token is not valid" });
        }

        request.user = faculty; // Set to student
        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        response.status(401).json({ message: "Token is not valid" });
    }
};

export default protectRouteFaculty;