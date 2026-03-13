import jwt from "jsonwebtoken";
import Faculty from "../models/Faculty.js";
import User from "../models/User.js";

const combinedAuth = async (request, response, next) => {
    try {
        const authHeader = request.header("Authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return response.status(401).json({
                message: "No authentication token",
                error: "Missing or invalid Authorization header",
            });
        }

        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) {
            return response.status(401).json({
                message: "No authentication token",
                error: "Token is empty",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded._id || decoded.id;

        // ✅ Check User model first (covers Supervisor + Program Chair)
        // Faculty is the minority of users hitting combinedAuth routes
        let user = await User.findById(userId).select("-password");
        let userType = user?.role || null;

        // ✅ Fall back to Faculty if not found in User model
        if (!user) {
            user = await Faculty.findById(userId).select("-password");
            userType = "Faculty";
        }

        if (!user) {
            return response.status(401).json({
                message: "User not found",
                error: "User ID not found in any user collection",
            });
        }

        // ✅ Explicit userType — not relying on missing field fallback
        request.user = user;
        request.userType = userType;

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return response.status(401).json({
                message: "Invalid token",
                error: "Token is invalid",
            });
        }

        if (error.name === "TokenExpiredError") {
            return response.status(401).json({
                message: "Token expired",
                error: "Authentication token has expired",
            });
        }

        console.error("Combined auth error:", error.message);
        return response.status(401).json({
            message: "Authentication failed",
            error: error.message,
        });
    }
};

export default combinedAuth;