// ============================================================================
// נתיבי אימות (Auth Routes)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מגדיר את נתיבי ה-API הציבוריים לניהול הזדהות המשתמש.
//
// הנתיבים (כולם תחת /api/auth):
//   • POST /register — הרשמת משתמש חדש
//   • POST /login    — התחברות והנפקת token
//   • POST /refresh  — חידוש token באמצעות refresh token
//   • POST /logout   — התנתקות (ביטול refresh token)
//
// הקשר במערכת:
//   הקובץ מחובר ב-server.ts תחת /api/auth ומפנה ל-authController.
// ============================================================================

import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
