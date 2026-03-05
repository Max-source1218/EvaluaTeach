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
import studentEvaluationRoutes from "./routes/studentEvaluationRoutes.js";
import facultyResultRoutes from "./routes/facultyResultRoutes.js";
import programChairResultRoutes from "./routes/programChairResultRoutes.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Start cron job
job.start();

// Middleware
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Mount all routes
app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api/student-detail", StudentDetailRoutes);
app.use("/api/student-evaluation", evaluationRoutes);
app.use("/api/supervisor-detail", supervisorDetailRoutes);
app.use("/api/supervisor-evaluation", supervisorEvaluationRoutes);
app.use("/api/faculty-evaluation", facultyEvaluationRoutes);
app.use("/api/student-evaluation", studentEvaluationRoutes);
app.use("/api/faculty-results", facultyResultRoutes);
app.use("/api/program-chair-results", programChairResultRoutes);

// Global Error Handler (MUST be before 404 handler)
app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR ===');
  console.error('Error type:', err.name || 'Unknown');
  console.error('Error message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  
  // Always return JSON
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    path: req.originalUrl,
    method: req.method
  });
});

// 404 Handler (MUST be last)
app.use((req, res) => {
  console.log('=== 404 NOT FOUND ===');
  console.log('Path:', req.path);
  console.log('Method:', req.method);
  
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      '/api/auth/*',
      '/api/faculty/*',
      '/api/student/*',
      '/api/admin/*',
      '/api/subject/*',
      '/api/student-detail/*',
      '/api/evaluation/*',
      '/api/supervisor-detail/*',
      '/api/supervisor-evaluation/*',
      '/api/faculty-evaluation/*',
      '/api/student-evaluation/*',
      '/api/faculty-results/*',
      '/api/program-chair-results/*'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log("=== SERVER STARTED ===");
  console.log("Port:", PORT);
  console.log("Environment:", process.env.NODE_ENV || 'development');
  console.log("Frontend URL:", process.env.FRONTEND_URL || 'http://localhost:8081');
  console.log("API Base URL: http://localhost:" + PORT + "/api");
  connectDB();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error);
  process.exit(1);
});