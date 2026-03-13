import jwt from "jsonwebtoken";
import Faculty from "../models/Faculty.js";

const protectRouteFaculty = async (request, response, next) => {
  try {
    const authHeader = request.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return response.status(401).json({ message: "No authentication token, access denied" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const facultyId = decoded._id || decoded.id;
    const faculty = await Faculty.findById(facultyId).select("-password");

    if (!faculty) {
      return response.status(401).json({ message: "Token is not valid - faculty not found" });
    }

    request.user = faculty;
    next();
  } catch (error) {
    console.error("Faculty auth error:", error.message);
    return response.status(401).json({ message: "Token is not valid" });
  }
};

export default protectRouteFaculty;