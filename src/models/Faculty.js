import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const facultySchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    profileImage: {
        type: String,
        default: "",
    },
    department: {
        type: String,
        required: true,
        enum: ['CCIT', 'CTE', 'CBAPA'],
    },
}, { timestamps: true });

// Hash password before saving user to DB
facultySchema.pre("save", async function() {  
    if (!this.isModified("password")) return;  

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        console.error("Error hashing password:", err);
        throw err;
    }
});

facultySchema.methods.comparePassword = async function(userPassword) {
    return await bcrypt.compare(userPassword, this.password);
};

const Faculty = mongoose.model("Faculty", facultySchema);
export default Faculty;