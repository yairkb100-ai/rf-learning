import { Router } from "express";
import {
  duplicateCourse,
  moveChapter,
  duplicateChapter,
  duplicateSpecialization,
} from "../controllers/adminOpsController";
import { adminCreateUser } from "../controllers/authController";
import {
  listUsers,
  updateUser,
  deleteUser,
  resetPassword,
  studentsProgressSummary,
  studentProgressDetail,
  dashboardStats,
} from "../controllers/adminUsersController";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// כל הפעולות כאן — מנהל בלבד
router.use(authenticate, requireAdmin);

// ניהול משתמשים (יצירת תלמידים ומנהלים — שרשרת הרשאות)
router.get("/users", listUsers);
router.post("/users", adminCreateUser);
router.put("/users/:id", updateUser);
router.put("/users/:id/reset-password", resetPassword);
router.delete("/users/:id", deleteUser);

// דשבורד מנהל — תמונת מצב מצטברת
router.get("/dashboard", dashboardStats);

// מעקב התקדמות תלמידים
router.get("/students/progress", studentsProgressSummary);
router.get("/students/:id/progress", studentProgressDetail);

router.post("/specializations/:id/duplicate", duplicateSpecialization);
router.post("/courses/:id/duplicate", duplicateCourse);
router.put("/chapters/:id/move", moveChapter);
router.post("/chapters/:id/duplicate", duplicateChapter);

export default router;
