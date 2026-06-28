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
router.post("/:chapterId/exam/submit", authenticate, submitExam);
router.get("/:chapterId/exam/results", authenticate, getExamResults);

export default router;
