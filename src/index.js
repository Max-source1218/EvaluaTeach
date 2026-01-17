import express from "express";
import cors  from "cors";
import "dotenv/config";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import StudentDetailRoutes from "./routes/studentDetailRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js"

import {connectDB} from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

job.start();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api/form", StudentDetailRoutes);
app.use("/api/evaluation", evaluationRoutes);

app.listen(PORT, () =>{
    console.log("Port is running on", PORT);
    connectDB();
});