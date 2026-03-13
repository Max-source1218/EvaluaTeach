import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

const protectRouteStudent = async (request, response, next) => {
  try {
    const authHeader = request.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return response.status(401).json({ message: "No authentication token, access denied" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const studentId = decoded._id || decoded.id;
    const student = await Student.findById(studentId).select("-password");

    if (!student) {
      return response.status(401).json({ message: "Token is not valid - student not found" });
    }

    request.user = student;
    next();
  } catch (error) {
    console.error("Student auth error:", error.message);
    return response.status(401).json({ message: "Token is not valid" });
  }
};

export default protectRouteStudent;