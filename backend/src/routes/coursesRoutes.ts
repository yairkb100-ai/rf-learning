// ============================================================================
// נתיבי קורסים (Courses Routes)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מגדיר את נתיבי ה-API של הקורסים — צפייה ציבורית וניהול למנהל.
//
// הנתיבים (כולם תחת /api/courses):
//   • GET    /     — כל הקורסים (optionalAuth: מסונן לפי מגמת המשתמש המחובר)
//   • GET    /:id  — קורס בודד (פתוח)
//   • POST   /     — יצירת קורס (מנהל)
//   • PUT    /:id  — עדכון קורס (מנהל)
//   • DELETE /:id  — מחיקת קורס (מנהל)
//
// הקשר במערכת:
//   מחובר ב-server.ts תחת /api/courses ומפנה ל-coursesController.
// ============================================================================

import { Router } from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/coursesController";
import { authenticate, requireAdmin, optionalAuth } from "../middleware/authMiddleware";

const router = Router();

// ציבורי - אך מסונן לפי המגמה של המשתמש המחובר (optionalAuth)
router.get("/", optionalAuth, getAllCourses);
router.get("/:id", getCourseById);

// מנהל בלבד
router.post("/", authenticate, requireAdmin, createCourse);
router.put("/:id", authenticate, requireAdmin, updateCourse);
router.delete("/:id", authenticate, requireAdmin, deleteCourse);

export default router;
