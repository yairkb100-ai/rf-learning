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
