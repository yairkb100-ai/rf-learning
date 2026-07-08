// ============================================================================
// נתיבי "אני" — התקדמות אישית של התלמיד (Me Routes)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מגדיר את הנתיבים האישיים של המשתמש המחובר (התלמיד עצמו), בניגוד לנתיבי
//   הניהול שמציגים נתונים על תלמידים אחרים. משמש את מסך "ההתקדמות שלי".
//
// הנתיבים (מקוננים תחת /api/me):
//   • GET /progress  — סיכום התקדמות התלמיד בכל הקורסים (סרגל התקדמות).
//   • GET /feedback  — הערות המנהל על התשובות שנבדקו לתלמיד.
//
// הקשר במערכת:
//   מחובר ב-server.ts תחת /api/me ומפנה ל-progressController.
//   כל הנתיבים דורשים התחברות (authenticate) — התלמיד רואה רק את הנתונים שלו.
// ============================================================================

import { Router } from "express";
import { getMyOverview, getMyFeedback } from "../controllers/progressController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/progress", authenticate, getMyOverview);
router.get("/feedback", authenticate, getMyFeedback);

export default router;
