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
