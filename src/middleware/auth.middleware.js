import jwt from "jsonwebtoken";
import User from "../models/User.js";

/*const response = await fetch('http://localhost:3000/api/student', {
    method: "POST",
    body: JSON.stringify({
        name,
        department
    }),
    headers: {Authorization: 'Bearer ${token}'},
});*/

const protectRoute = async (request, response, next) => {

    try{
        // Get Token

        const token = request.header("Authorization").replace("Bearer ", "");
        if (!token) return response.status(401).json({message: "No authentication token, access denied"});

        //Verify token
        const decoded = jwt.verify(token, process.env.JWT.SECRET);

        //Find user
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) return response.status(401).json({message: "Token is not valid"})

        request.user = user;
        next();
    }catch(error){
        console.error("Authentication error: ", error.message);
        response.status(401).json({message: "Token is not valid"});
    }
};

export default protectRoute;
