import { Router } from "express";
import {
  duplicateCourse,
  moveChapter,
  duplicateChapter,
  duplicateSpecialization,
} from "../controllers/adminOpsController";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// כל הפעולות כאן — מנהל בלבד
router.use(authenticate, requireAdmin);

router.post("/specializations/:id/duplicate", duplicateSpecialization);
router.post("/courses/:id/duplicate", duplicateCourse);
router.put("/chapters/:id/move", moveChapter);
router.post("/chapters/:id/duplicate", duplicateChapter);

export default router;
