// ============================================================================
// נתיבי חומר לימוד (Content Routes)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מגדיר את נתיבי חומר הלימוד (בלוקי תוכן: טקסט עשיר, תמונות, וידאו, קבצים)
//   של פרק. ה-router עם mergeParams כדי לרשת את :chapterId מהנתיב האב.
//   כולל תמיכה בהעלאת קבצים באמצעות multer (השדות file ו-image).
//
// הנתיבים (מקוננים תחת .../chapters/:chapterId/content):
//   • GET    /     — שליפת חומר הלימוד (כל משתמש מחובר)
//   • POST   /     — הוספת בלוק תוכן (מנהל, כולל העלאת קובץ)
//   • PUT    /:id  — עדכון בלוק תוכן (מנהל, כולל העלאת קובץ)
//   • DELETE /:id  — מחיקת בלוק תוכן (מנהל)
//
// הקשר במערכת:
//   מחובר גם דרך chaptersRoutes וגם ישירות ב-server.ts, ומפנה
//   ל-contentController. ההעלאות מטופלות ע"י upload מ-config/upload.
// ============================================================================

import { Router } from "express";
import {
  getCourseContent,
  addCourseContent,
  updateCourseContent,
  deleteCourseContent,
} from "../controllers/contentController";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
import { upload } from "../config/upload";

const router = Router({ mergeParams: true });

// קבצים: "file" לסוגי קובץ בודד, "image" לתמונה ב-RICH
const contentUpload = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

// תלמיד/כולם — צפייה בחומר
router.get("/", authenticate, getCourseContent);

// מנהל — הוספה, עריכה, מחיקה
router.post("/", authenticate, requireAdmin, contentUpload, addCourseContent);
router.put("/:id", authenticate, requireAdmin, contentUpload, updateCourseContent);
router.delete("/:id", authenticate, requireAdmin, deleteCourseContent);

export default router;
