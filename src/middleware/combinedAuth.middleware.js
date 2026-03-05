import jwt from "jsonwebtoken";
import Faculty from "../models/Faculty.js";
import User from "../models/User.js";

const combinedAuth = async (request, response, next) => {
    try {
        const authHeader = request.header("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("=== AUTH FAILED: No token ===");
            return response.status(401).json({ 
                message: "No authentication token",
                error: "Missing or invalid Authorization header"
            });
        }
        
        const token = authHeader.replace("Bearer ", "").trim();
        
        if (!token) {
            console.log("=== AUTH FAILED: Empty token ===");
            return response.status(401).json({ 
                message: "No authentication token",
                error: "Token is empty"
            });
        }
        
        console.log("=== COMBINED AUTH ===");
        console.log("Token (first 20 chars):", token.substring(0, 20) + "...");
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded _id:", decoded._id);
        console.log("Decoded role:", decoded.role);

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
            console.log("=== AUTH FAILED: User not found ===");
            return response.status(401).json({ 
                message: "User not found",
                error: "User ID not found in database"
            });
        }

        // Add user info to request
        request.user = user;
        request.userType = user.role || "Faculty";
        console.log("=== AUTH SUCCESS ===");
        console.log("User:", user.username, "| Role:", user.role);
        
        next();
    } catch (error) {
        console.error("=== AUTH ERROR ===");
        console.error("Error type:", error.name);
        console.error("Error message:", error.message);
        
        // Handle JWT specific errors
        if (error.name === "JsonWebTokenError") {
            return response.status(401).json({ 
                message: "Invalid token",
                error: "Token is invalid"
            });
        }
        
        if (error.name === "TokenExpiredError") {
            return response.status(401).json({ 
                message: "Token expired",
                error: "Authentication token has expired"
            });
        }
        
        // Generic error
        return response.status(401).json({ 
            message: "Authentication failed",
            error: error.message
        });
    }
};

export default combinedAuth;