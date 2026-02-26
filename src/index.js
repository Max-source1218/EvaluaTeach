import express from "express";
import cors from "cors";
import "dotenv/config";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import StudentDetailRoutes from "./routes/studentDetailRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import supervisorDetailRoutes from "./routes/supervisorDetailRoutes.js";
import supervisorEvaluationRoutes from "./routes/supervisor_evaluationRoutes.js";
import facultyEvaluationRoutes from "./routes/facultyEvaluationRoutes.js";
import facultyEvaluationResultsRoutes from "./routes/facultyEvaluationResults.js";
import studentEvaluationRoutes from "./routes/studentEvaluationRoutes.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

job.start();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api/student-detail", StudentDetailRoutes); 
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/supervisor-detail", supervisorDetailRoutes);
app.use("/api/supervisor-evaluation", supervisorEvaluationRoutes);
app.use("/api/faculty-evaluation", facultyEvaluationRoutes);
app.use("/api/faculty-evaluations", facultyEvaluationResultsRoutes);
app.use("/api/student-evaluation", studentEvaluationRoutes);

app.listen(PORT, () => {
    console.log("Port is running on", PORT);
    connectDB();
});