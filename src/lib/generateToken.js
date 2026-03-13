// lib/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    return jwt.sign({ _id: userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

export default generateToken;