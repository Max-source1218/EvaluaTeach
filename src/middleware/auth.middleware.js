import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (request, response, next) => {
    try {
        // Get Token (safely handle missing header)
        const authHeader = request.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({ message: "No authentication token, access denied" });
        }
        const token = authHeader.replace("Bearer ", "");

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);

        // Find user
        const user = await User.findById(decoded._id).select("-password");
        if (!user) {
            return response.status(401).json({ message: "Token is not valid - user not found" });
        }

        console.log('Authenticated user:', user._id, user.role);
        request.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        response.status(401).json({ message: "Token is not valid" });
    }
};

export default protectRoute;