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
