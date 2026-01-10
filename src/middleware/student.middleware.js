import jwt from "jsonwebtoken";
import Student from "../models/User.js";

const protectRouteStudent = async (request, response, next) => {
    try {
        // Get Token (safely handle missing header)
        const authHeader = request.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "No authentication token, access denied" });
        }
        const token = authHeader.replace("Bearer ", "");

        // Verify token (fix secret name)
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Corrected: no dot

        // Find user (fix payload key to match _id)
        const user = await Student.findById(decoded._id).select("-password"); // Changed to decoded._id
        if (!user) {
            return response.status(401).json({ message: "Token is not valid" });
        }

        request.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error.message); // More specific logging
        response.status(401).json({ message: "Token is not valid" });
    }
};

export default protectRouteStudent;