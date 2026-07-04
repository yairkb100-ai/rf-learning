// ============================================================================
// נתיבי מגמות (Specializations Routes)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מגדיר את נתיבי ה-API של המגמות (התמחויות) — צפייה ציבורית וניהול למנהל.
//
// הנתיבים (כולם תחת /api/specializations):
//   • GET    /     — כל המגמות (פתוח)
//   • POST   /     — יצירת מגמה (מנהל)
//   • PUT    /:id  — עדכון מגמה (מנהל)
//   • DELETE /:id  — מחיקת מגמה (מנהל)
//
// הקשר במערכת:
//   מחובר ב-server.ts תחת /api/specializations ומפנה
//   ל-specializationsController.
// ============================================================================

import { Router } from "express";
import {
  getAllSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
} from "../controllers/specializationsController";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// ציבורי — צפייה במגמות
router.get("/", getAllSpecializations);

// מנהל בלבד
router.post("/", authenticate, requireAdmin, createSpecialization);
router.put("/:id", authenticate, requireAdmin, updateSpecialization);
router.delete("/:id", authenticate, requireAdmin, deleteSpecialization);

export default router;
