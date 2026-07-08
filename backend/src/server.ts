import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { pool } from "./config/db";
import { runMigrations } from "./db/migrate";
import authRoutes from "./routes/authRoutes";
import coursesRoutes from "./routes/coursesRoutes";
import specializationsRoutes from "./routes/specializationsRoutes";
import adminOpsRoutes from "./routes/adminOpsRoutes";
import chaptersRoutes from "./routes/chaptersRoutes";
import progressRoutes from "./routes/progressRoutes";
import contentRoutes from "./routes/contentRoutes";

dotenv.config();

// בדיקת סודות בעלייה: אם חסר משתנה סביבה קריטי, נעצור מיד עם הודעה ברורה
// (במקום לעלות עם JWT_SECRET=undefined ולהיכשל בצורה מבלבלת בהתחברות).
const REQUIRED_ENV = [
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(
    `\n[config] ✗ חסרים משתני סביבה חיוניים: ${missingEnv.join(", ")}\n` +
      `[config]   הגדר אותם בקובץ backend/.env (ראה backend/.env.example) ונסה שוב.\n`
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: בייצור אפשר להגביל למקור מורשה דרך CORS_ORIGIN (למשל https://learn.org.co.il).
// אם לא הוגדר — פתוח (נוח לפיתוח), עם אזהרה כדי שלא יישכח בייצור.
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  app.use(cors({ origin: corsOrigin.split(",").map((s) => s.trim()) }));
} else {
  console.warn(
    "[config] ⚠ CORS_ORIGIN לא הוגדר — ה-API פתוח לכל מקור. מומלץ להגדיר בייצור."
  );
  app.use(cors());
}
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

// מריץ מיגרציות אוטומטית לפני עליית השרת; נכשל בריצה במקום לעלות על סכמה שבורה
runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[migrate] כשל בהרצת מיגרציות — השרת לא יעלה:", err);
    process.exit(1);
  });
