// ============================================================================
// בקר ניהול משתמשים (Admin Users Controller)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מרכז את כל הפעולות שמנהל מבצע על משתמשים במערכת.
//
// מה יש כאן (הפונקציות המיוצאות):
//   • listUsers            — שליפת רשימת המשתמשים (עם סינון לפי תפקיד)
//   • updateUser           — עדכון פרטי משתמש קיים
//   • deleteUser           — מחיקת משתמש
//   • resetPassword        — איפוס סיסמה למשתמש
//   • studentsProgressSummary / studentProgressDetail — מעקב התקדמות תלמידים
//   • dashboardStats       — נתונים מצטברים למסך הדשבורד
//
// הקשר במערכת:
//   כל הפונקציות כאן נקראות דרך הנתיבים ב-adminOpsRoutes.ts, שכבר מוודאים
//   שהמשתמש מחובר ובעל תפקיד מנהל (authenticate + requireAdmin). לכן בתוך
//   הקובץ הזה מניחים שהקורא הוא מנהל מאומת.
//
// טבלאות עיקריות: users, specializations, quiz_attempts_course, user_progress.
// ============================================================================

import { Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";
import { PASSWORD_RE } from "./authController";

// GET /api/admin/users?role=STUDENT|ADMIN  — מחזיר רשימת משתמשים (מנהל בלבד).
// אפשר לסנן לפי תפקיד; כולל את שם המגמה ואת שם מי שיצר את המשתמש.
export async function listUsers(req: AuthRequest, res: Response) {
  const { role } = req.query;
  try {
    const params: any[] = [];
    let where = "";
    if (role === "STUDENT" || role === "ADMIN") {
      params.push(role);
      where = `WHERE u.role = $1`;
    }
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.national_id, u.role, u.title,
              u.specialization_id, s.name AS specialization_name,
              creator.full_name AS created_by_name, u.created_at
       FROM users u
       LEFT JOIN specializations s ON s.id = u.specialization_id
       LEFT JOIN users creator ON creator.id = u.created_by
       ${where}
       ORDER BY u.role, u.full_name`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// PUT /api/admin/users/:id  - עדכון משתמש (מגמה / שם). מנהל בלבד.
export async function updateUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { full_name, specialization_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           specialization_id = CASE WHEN $2::boolean THEN $3 ELSE specialization_id END
       WHERE id = $4
       RETURNING id, full_name, username, role, specialization_id`,
      [full_name || null, specialization_id !== undefined, specialization_id ?? null, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "משתמש לא נמצא" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// PUT /api/admin/users/:id/reset-password  - איפוס סיסמה ע"י מנהל. נכנס לתוקף מיד.
export async function resetPassword(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { password } = req.body;
  if (!password || !PASSWORD_RE.test(password)) {
    res.status(400).json({ error: "הסיסמה חייבת להכיל אות גדולה, אות קטנה ומספר, באורך 6 עד 8 תווים" });
    return;
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username",
      [password_hash, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "משתמש לא נמצא" });
      return;
    }
    res.json({ message: "הסיסמה אופסה בהצלחה" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// DELETE /api/admin/users/:id  - מחיקת משתמש (מנהל בלבד). אי אפשר למחוק את עצמך.
export async function deleteUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  if (Number(id) === req.user!.userId) {
    res.status(400).json({ error: "לא ניתן למחוק את המשתמש שלך" });
    return;
  }
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "משתמש לא נמצא" });
      return;
    }
    res.json({ message: "המשתמש נמחק" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// GET /api/admin/students/progress  - סיכום התקדמות כל התלמידים (מנהל בלבד).
// מחזיר לכל תלמיד: כמה פרקים השלים, ציון מבחן ממוצע ומספר ניסיונות.
export async function studentsProgressSummary(_req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.username, s.name AS specialization_name,
              COUNT(DISTINCT up.chapter_id) FILTER (WHERE up.is_completed) AS chapters_completed,
              COUNT(DISTINCT qa.id) AS exam_attempts,
              ROUND(AVG(qa.score)) AS avg_score
       FROM users u
       LEFT JOIN specializations s ON s.id = u.specialization_id
       LEFT JOIN user_progress up ON up.user_id = u.id
       LEFT JOIN quiz_attempts_course qa ON qa.user_id = u.id
       WHERE u.role = 'STUDENT'
       GROUP BY u.id, s.name
       ORDER BY u.full_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// GET /api/admin/students/:id/progress  - פירוט התקדמות תלמיד יחיד (מנהל בלבד).
export async function studentProgressDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const student = await pool.query(
      `SELECT u.id, u.full_name, u.username, s.name AS specialization_name
       FROM users u LEFT JOIN specializations s ON s.id = u.specialization_id
       WHERE u.id = $1 AND u.role = 'STUDENT'`,
      [id]
    );
    if (student.rows.length === 0) {
      res.status(404).json({ error: "תלמיד לא נמצא" });
      return;
    }

    // פרקים שהושלמו, מקובצים לפי קורס
    const chapters = await pool.query(
      `SELECT c.id AS course_id, c.title AS course_title,
              ch.id AS chapter_id, ch.title AS chapter_title,
              up.is_completed, up.completed_at
       FROM user_progress up
       JOIN chapters ch ON ch.id = up.chapter_id
       JOIN courses c ON c.id = ch.course_id
       WHERE up.user_id = $1
       ORDER BY c.title, ch.order_number`,
      [id]
    );

    // ניסיונות מבחן
    const attempts = await pool.query(
      `SELECT qa.id, qa.course_id, c.title AS course_title, qa.score, qa.status, qa.submitted_at
       FROM quiz_attempts_course qa
       JOIN courses c ON c.id = qa.course_id
       WHERE qa.user_id = $1
       ORDER BY qa.submitted_at DESC`,
      [id]
    );

    res.json({
      student: student.rows[0],
      chapters: chapters.rows,
      exam_attempts: attempts.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// GET /api/admin/dashboard  - תמונת מצב מצטברת למנהל (מנהל בלבד).
export async function dashboardStats(_req: AuthRequest, res: Response) {
  try {
    const counts = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE role = 'STUDENT')        AS total_students,
         (SELECT COUNT(*) FROM users WHERE role = 'ADMIN')          AS total_admins,
         (SELECT COUNT(*) FROM courses)                             AS total_courses,
         (SELECT COUNT(*) FROM specializations)                     AS total_specializations,
         (SELECT ROUND(AVG(score)) FROM quiz_attempts_course)       AS avg_score,
         (SELECT COUNT(*) FROM quiz_attempts_course
            WHERE status = 'PENDING_REVIEW')                        AS pending_reviews`
    );

    // ממוצע פרקים שהושלמו לתלמיד
    const completion = await pool.query(
      `SELECT ROUND(AVG(cc), 1) AS avg_completion FROM (
         SELECT COUNT(*) FILTER (WHERE up.is_completed) AS cc
         FROM users u
         LEFT JOIN user_progress up ON up.user_id = u.id
         WHERE u.role = 'STUDENT'
         GROUP BY u.id
       ) t`
    );

    // קורסים עם הציון הממוצע הנמוך ביותר (אינדיקציה לתוכן קשה)
    const hardest = await pool.query(
      `SELECT c.id, c.title, ROUND(AVG(qa.score)) AS avg_score, COUNT(qa.id) AS attempts
       FROM quiz_attempts_course qa
       JOIN courses c ON c.id = qa.course_id
       GROUP BY c.id, c.title
       ORDER BY AVG(qa.score) ASC
       LIMIT 5`
    );

    res.json({
      ...counts.rows[0],
      avg_completion: completion.rows[0].avg_completion,
      hardest_courses: hardest.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}
