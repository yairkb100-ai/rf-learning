// ============================================================================
// נתיבי פרקים ומבחנים (Chapters Routes)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מגדיר את נתיבי הפרקים בתוך קורס, וכן את נתיבי השאלות והמבחן של כל פרק.
//   ה-router מוגדר עם mergeParams כדי לרשת את :courseId מהנתיב האב.
//
// הנתיבים (מקוננים תחת /api/courses/:courseId/chapters):
//   • GET    /                         — כל הפרקים של הקורס (פתוח)
//   • GET    /:id                      — פרק בודד (פתוח)
//   • POST   /                         — יצירת פרק (מנהל)
//   • PUT    /:id                      — עדכון פרק (מנהל)
//   • DELETE /:id                      — מחיקת פרק (מנהל)
//   • GET    /:chapterId/questions     — שאלות הפרק (מנהל)
//   • POST   /:chapterId/questions     — הוספת שאלה (מנהל)
//   • DELETE /:chapterId/questions/:id — מחיקת שאלה (מנהל)
//   • GET    /:chapterId/exam          — קבלת המבחן לתלמיד (מחובר)
//   • POST   /:chapterId/exam/submit   — הגשת מבחן (מחובר)
//   • GET    /:chapterId/exam/results  — תוצאות המבחן (מחובר)
//   • use   /:chapterId/content        — נתיבי חומר הלימוד של הפרק (contentRoutes)
//
// הקשר במערכת:
//   מחובר ב-server.ts תחת /api/courses/:courseId/chapters ומפנה
//   ל-chaptersController ו-examController.
// ============================================================================

import { Router } from "express";
import {
  getChaptersByCourse,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
} from "../controllers/chaptersController";
import {
  getQuestions,
  getExam,
  createQuestion,
  deleteQuestion,
  submitExam,
  getExamResults,
} from "../controllers/examController";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
import { upload } from "../config/upload";
import contentRoutes from "./contentRoutes";

const router = Router({ mergeParams: true });

// חומר לימוד ברמת הפרק: /chapters/:chapterId/content
router.use("/:chapterId/content", contentRoutes);

router.get("/", getChaptersByCourse);
router.get("/:id", getChapterById);
router.post("/", authenticate, requireAdmin, createChapter);
router.put("/:id", authenticate, requireAdmin, updateChapter);
router.delete("/:id", authenticate, requireAdmin, deleteChapter);

// שאלות ומבחן ברמת הפרק (chapterId הוא ה-:id של הפרק)
router.get("/:chapterId/questions", authenticate, requireAdmin, getQuestions);
router.post("/:chapterId/questions", authenticate, requireAdmin, createQuestion);
router.delete("/:chapterId/questions/:id", authenticate, requireAdmin, deleteQuestion);
router.get("/:chapterId/exam", authenticate, getExam);
// העלאת קובץ תשובה למבחן: התלמיד שולח קובץ, והשרת שומר אותו תחת /uploads
// ומחזיר את הנתיב הציבורי + השם המקורי, כדי שההגשה (submit) תשמור נתיב תקין.
router.post("/:chapterId/exam/upload", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "לא התקבל קובץ" });
    return;
  }
  res.json({ file_path: `/uploads/${req.file.filename}`, file_name: req.file.originalname });
});
router.post("/:chapterId/exam/submit", authenticate, submitExam);
router.get("/:chapterId/exam/results", authenticate, getExamResults);

export default router;
