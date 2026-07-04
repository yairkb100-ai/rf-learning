// ============================================================================
// נתיבי התקדמות (Progress Routes)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מגדיר את נתיבי מעקב ההתקדמות של תלמיד בקורס — צפייה וסימון פרקים.
//   ה-router עם mergeParams כדי לרשת את :courseId מהנתיב האב.
//
// הנתיבים (מקוננים תחת /api/courses/:courseId/progress):
//   • GET    /                     — התקדמות המשתמש בקורס (מחובר)
//   • POST   /:chapterId/complete  — סימון פרק כהושלם (מחובר)
//   • DELETE /:chapterId/complete  — ביטול סימון פרק (מחובר)
//
// הקשר במערכת:
//   מחובר ב-server.ts תחת /api/courses/:courseId/progress ומפנה
//   ל-progressController.
// ============================================================================

import { Router } from "express";
import {
  getCourseProgress,
  markChapterComplete,
  unmarkChapterComplete,
} from "../controllers/progressController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router({ mergeParams: true });

// התקדמות בקורס
router.get("/", authenticate, getCourseProgress);

// סימון פרק כהושלם / ביטול
router.post("/:chapterId/complete", authenticate, markChapterComplete);
router.delete("/:chapterId/complete", authenticate, unmarkChapterComplete);

export default router;
