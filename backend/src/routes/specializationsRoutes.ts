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
