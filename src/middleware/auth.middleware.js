import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (request, response, next) => {
  try {
    const authHeader = request.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return response.status(401).json({ message: "No authentication token, access denied" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both `id` and `_id` in JWT payload
    const userId = decoded._id || decoded.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return response.status(401).json({ message: "Token is not valid - user not found" });
    }

    request.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return response.status(401).json({ message: "Token is not valid" });
  }
};

export default protectRoute;