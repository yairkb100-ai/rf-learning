import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { pool } from "./config/db";
import authRoutes from "./routes/authRoutes";
import coursesRoutes from "./routes/coursesRoutes";
import specializationsRoutes from "./routes/specializationsRoutes";
import adminOpsRoutes from "./routes/adminOpsRoutes";
import chaptersRoutes from "./routes/chaptersRoutes";
import progressRoutes from "./routes/progressRoutes";
import contentRoutes from "./routes/contentRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// הגשת קבצים שהועלו (תמונות, וידאו, PDF)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (_req, res) => {
  res.json({ message: "RF Learning System API is running" });
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/specializations", specializationsRoutes);
app.use("/api/admin", adminOpsRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/courses/:courseId/chapters", chaptersRoutes);
app.use("/api/courses/:courseId/progress", progressRoutes);
app.use("/api/courses/:courseId/content", contentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
