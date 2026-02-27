import jwt from "jsonwebtoken";
import Faculty from "../models/Faculty.js";
import User from "../models/User.js";

const combinedAuth = async (request, response, next) => {
    try {
        const authHeader = request.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "No authentication token" });
        }
        
        const token = authHeader.replace("Bearer ", "");
        console.log("=== COMBINED AUTH ===");
        console.log("Token:", token.substring(0, 20) + "...");
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded _id:", decoded._id);

        // Try to find Faculty first
        let user = await Faculty.findById(decoded._id).select("-password");
        
        // If not found, try User (admin)
        if (!user) {
            user = await User.findById(decoded._id).select("-password");
            console.log("Found as admin User:", user ? "YES" : "NO");
        } else {
            console.log("Found as Faculty:", "YES");
        }
        
        if (!user) {
            return response.status(401).json({ message: "User not found" });
        }

        // Add user info to request
        request.user = user;
        next();
    } catch (error) {
        console.error("Auth error:", error.message);
        response.status(401).json({ message: "Invalid token" });
    }
};

export default combinedAuth;