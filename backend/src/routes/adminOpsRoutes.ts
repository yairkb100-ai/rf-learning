// ============================================================================
// נתיבי פעולות מנהל (Admin Ops Routes)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מגדיר את כל נתיבי ה-API שתחת /api/admin — פעולות המיועדות למנהלים בלבד:
//   ניהול משתמשים, דשבורד, מעקב תלמידים, בדיקת שאלות פתוחות, ושכפול תוכן.
//
// אבטחה:
//   router.use(authenticate, requireAdmin) בראש הקובץ — כל הנתיבים כאן
//   דורשים משתמש מחובר בעל תפקיד מנהל.
//
// הנתיבים (כולם תחת /api/admin):
//   • GET    /users                        — רשימת משתמשים (סינון לפי תפקיד)
//   • POST   /users                        — יצירת משתמש חדש (תלמיד/מנהל)
//   • PUT    /users/:id                    — עדכון פרטי משתמש
//   • PUT    /users/:id/reset-password     — איפוס סיסמת משתמש
//   • DELETE /users/:id                    — מחיקת משתמש
//   • GET    /dashboard                    — נתוני דשבורד מצטברים
//   • GET    /students/progress            — סיכום התקדמות כל התלמידים
//   • GET    /students/:id/progress        — פירוט התקדמות תלמיד יחיד
//   • GET    /my-students                  — התלמידים המשויכים למנהל הנוכחי
//   • POST   /students/:studentId/assign   — שיוך תלמיד למנהל
//   • POST   /students/:studentId/reset-data — איפוס נתוני תלמיד
//   • GET    /grading/history/:studentId   — היסטוריית ניקוד של תלמיד
//   • GET    /grading/pending              — שאלות/קבצים הממתינים לניקוד
//   • POST   /grading/:gradeId/submit      — שמירת ציון לשאלה פתוחה
//   • POST   /specializations/:id/duplicate — שכפול מגמה
//   • POST   /courses/:id/duplicate        — שכפול קורס
//   • PUT    /chapters/:id/move            — העברת פרק (סדר/קורס)
//   • POST   /chapters/:id/duplicate       — שכפול פרק
//
// הקשר במערכת:
//   הקובץ מחובר ב-server.ts תחת /api/admin ומפנה ל-adminOpsController,
//   adminUsersController, authController ו-gradingController.
// ============================================================================

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
import {
  getPendingGrading,
  submitGrade,
  getGradingHistory,
  assignStudentToAdmin,
  getMyStudents,
  resetStudentData,
} from "../controllers/gradingController";
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
router.get("/my-students", getMyStudents);
router.post("/students/:studentId/assign", assignStudentToAdmin);
router.post("/students/:studentId/reset-data", resetStudentData);
router.get("/grading/history/:studentId", getGradingHistory);

// ניקוד שאלות פתוחות וקבצים
router.get("/grading/pending", getPendingGrading);
router.post("/grading/:gradeId/submit", submitGrade);

router.post("/specializations/:id/duplicate", duplicateSpecialization);
router.post("/courses/:id/duplicate", duplicateCourse);
router.put("/chapters/:id/move", moveChapter);
router.post("/chapters/:id/duplicate", duplicateChapter);

export default router;
