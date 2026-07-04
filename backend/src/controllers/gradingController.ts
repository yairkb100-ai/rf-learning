import { Request, Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// האם המנהל הוא מנהל כללי (רואה ומנקד את כל התלמידים)
async function isSuperAdmin(adminId: number): Promise<boolean> {
  const r = await pool.query(
    "SELECT is_super_admin FROM users WHERE id = $1",
    [adminId]
  );
  return r.rows[0]?.is_super_admin === true;
}

// GET /api/admin/grading/pending - רשימת שאלות הממתינות לבדיקה
export async function getPendingGrading(req: AuthRequest, res: Response) {
  const adminId = req.user!.userId;

  try {
    const superAdmin = await isSuperAdmin(adminId);
    // מנהל כללי רואה הכל; מנהל רגיל רק תלמידים המשויכים אליו
    const scopeClause = superAdmin ? "" : "AND u.assigned_admin_id = $1 ";
    const params = superAdmin ? [] : [adminId];

    // קוראים ישירות מהתשובות שממתינות לבדיקה (needs_grading = TRUE) —
    // זהו מקור האמת. מזהה הפריט לבדיקה הוא id של השורה ב-quiz_attempt_answers.
    const result = await pool.query(
      `SELECT
        qaa.id,
        qaa.attempt_id,
        qaa.question_id,
        qa.user_id AS student_id,
        u.full_name AS student_name,
        u.national_id,
        c.title AS course_title,
        q.question_text,
        q.question_type,
        q.model_answer,
        qaa.free_text_answer,
        qaa.file_path,
        qaa.file_name,
        qa.submitted_at AS created_at,
        qaa.grading_status AS status
      FROM quiz_attempt_answers qaa
      JOIN quiz_attempts_course qa ON qaa.attempt_id = qa.id
      JOIN users u ON qa.user_id = u.id
      JOIN courses c ON qa.course_id = c.id
      JOIN questions q ON qaa.question_id = q.id
      WHERE qaa.needs_grading = TRUE ${scopeClause}
      ORDER BY qa.submitted_at ASC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// POST /api/admin/grading/:gradeId/submit - שליחת ניקוד לשאלה
export async function submitGrade(req: AuthRequest, res: Response) {
  const adminId = req.user!.userId;
  const { gradeId } = req.params;
  const { score, comments } = req.body as {
    score?: number;
    comments?: string;
  };

  if (score === undefined || score < 0 || score > 100) {
    res.status(400).json({ error: "ציון חייב להיות בין 0 ל-100" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // קבל את פרטי התשובה הממתינה (gradeId הוא id של quiz_attempt_answers)
    const ansResult = await client.query(
      `SELECT qaa.id, qaa.attempt_id, qaa.question_id, qaa.points_awarded, qaa.max_points,
              qa.user_id AS student_id, u.assigned_admin_id
       FROM quiz_attempt_answers qaa
       JOIN quiz_attempts_course qa ON qaa.attempt_id = qa.id
       JOIN users u ON qa.user_id = u.id
       WHERE qaa.id = $1`,
      [gradeId]
    );

    if (ansResult.rows.length === 0) {
      res.status(404).json({ error: "פריט לבדיקה לא נמצא" });
      return;
    }

    const { attempt_id, question_id, student_id, assigned_admin_id, max_points } = ansResult.rows[0];

    // הרשאה: מנהל כללי, או המנהל שהתלמיד משויך אליו
    if (Number(assigned_admin_id) !== adminId && !(await isSuperAdmin(adminId))) {
      res.status(403).json({ error: "אינך מורשה לבדוק פריט זה" });
      return;
    }

    const oldPoints = ansResult.rows[0].points_awarded || 0;
    // score הוא 0-100 (אחוז); ממירים לנקודות בפועל לפי max_points של השאלה
    const newPoints = (Number(score) / 100) * Number(max_points || 1);

    // עדכן את הניקוד בquiz_attempt_answers
    await client.query(
      `UPDATE quiz_attempt_answers
       SET points_awarded = $1, grading_status = 'GRADED', graded_by = $2, graded_at = CURRENT_TIMESTAMP,
           admin_comments = $3, needs_grading = FALSE
       WHERE id = $4`,
      [newPoints, adminId, comments || null, gradeId]
    );

    // שמור בgrading_history
    await client.query(
      `INSERT INTO grading_history
        (attempt_id, question_id, student_id, admin_id, old_score, new_score, admin_comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [attempt_id, question_id, student_id, adminId, oldPoints, newPoints, comments || null]
    );

    // בדוק אם כל השאלות בexam הזה מניקוד
    const pendingCount = await client.query(
      `SELECT COUNT(*) as count FROM quiz_attempt_answers
       WHERE attempt_id = $1 AND needs_grading = TRUE`,
      [attempt_id]
    );

    const stillPending = Number(pendingCount.rows[0].count) > 0;

    // עדכן את סטטוס המבחן
    const newStatus = stillPending ? "PARTIALLY_GRADED" : "GRADED";
    await client.query(
      `UPDATE quiz_attempts_course SET status = $1 WHERE id = $2`,
      [newStatus, attempt_id]
    );

    // אם כל השאלות נבדקו, חישוב ציון סופי
    if (!stillPending) {
      const scoreResult = await client.query(
        `SELECT SUM(points_awarded) / SUM(max_points) * 100 as final_score
         FROM quiz_attempt_answers
         WHERE attempt_id = $1`,
        [attempt_id]
      );
      const finalScore = scoreResult.rows[0]?.final_score || 0;
      await client.query(
        `UPDATE quiz_attempts_course SET score = $1 WHERE id = $2`,
        [finalScore, attempt_id]
      );
    }

    await client.query("COMMIT");

    res.json({ message: "הניקוד נשמר בהצלחה", gradeId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  } finally {
    client.release();
  }
}

// POST /api/admin/students/:studentId/reset-data - איפוס נתוני התלמיד
// (התקדמות פרקים, ניסיונות מבחן, ותשובות). לא נוגע בפרטי המשתמש עצמו.
export async function resetStudentData(req: AuthRequest, res: Response) {
  const adminId = req.user!.userId;
  const { studentId } = req.params;

  const client = await pool.connect();
  try {
    // הרשאה: מנהל כללי, או המנהל שהתלמיד משויך אליו
    const stu = await client.query(
      "SELECT assigned_admin_id, role FROM users WHERE id = $1",
      [studentId]
    );
    if (stu.rows.length === 0 || stu.rows[0].role !== "STUDENT") {
      res.status(404).json({ error: "תלמיד לא נמצא" });
      return;
    }
    if (Number(stu.rows[0].assigned_admin_id) !== adminId && !(await isSuperAdmin(adminId))) {
      res.status(403).json({ error: "אינך מורשה לאפס נתוני תלמיד זה" });
      return;
    }

    await client.query("BEGIN");
    // מחיקת תשובות המבחן (לפי הניסיונות של התלמיד)
    await client.query(
      `DELETE FROM quiz_attempt_answers WHERE attempt_id IN
        (SELECT id FROM quiz_attempts_course WHERE user_id = $1)`,
      [studentId]
    );
    // מחיקת רשומות עזר בתור/היסטוריה אם קיימות
    await client.query("DELETE FROM grading_queue WHERE student_id = $1", [studentId]);
    await client.query("DELETE FROM grading_history WHERE student_id = $1", [studentId]);
    // מחיקת ניסיונות המבחן וההתקדמות
    await client.query("DELETE FROM quiz_attempts_course WHERE user_id = $1", [studentId]);
    await client.query("DELETE FROM user_progress WHERE user_id = $1", [studentId]);
    await client.query("COMMIT");

    res.json({ message: "נתוני התלמיד אופסו בהצלחה" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  } finally {
    client.release();
  }
}

// GET /api/admin/grading/history/:studentId - היסטוריית ניקוד של סטודנט
export async function getGradingHistory(req: AuthRequest, res: Response) {
  const adminId = req.user!.userId;
  const { studentId } = req.params;

  try {
    // מנהל כללי רשאי לראות כל תלמיד; מנהל רגיל רק את המשויכים אליו
    if (!(await isSuperAdmin(adminId))) {
      const assignedResult = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND assigned_admin_id = $2`,
        [studentId, adminId]
      );
      if (assignedResult.rows.length === 0) {
        res.status(403).json({ error: "אינך מורשה לראות סטודנט זה" });
        return;
      }
    }

    const result = await pool.query(
      `SELECT
        gh.id,
        gh.attempt_id,
        gh.question_id,
        q.question_text,
        gh.old_score,
        gh.new_score,
        gh.admin_comments,
        gh.graded_at
      FROM grading_history gh
      JOIN questions q ON gh.question_id = q.id
      WHERE gh.student_id = $1 AND gh.admin_id = $2
      ORDER BY gh.graded_at DESC`,
      [studentId, adminId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// POST /api/admin/students/:studentId/assign - הקצה סטודנט לadmin
export async function assignStudentToAdmin(req: AuthRequest, res: Response) {
  const adminId = req.user!.userId;
  const { studentId } = req.params;

  try {
    // בדוק שesoteric הוא admin
    const adminCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'ADMIN'`,
      [adminId]
    );

    if (adminCheck.rows.length === 0) {
      res.status(403).json({ error: "רק admins יכולים להקצות סטודנטים" });
      return;
    }

    // עדכן את assigned_admin_id
    const result = await pool.query(
      `UPDATE users SET assigned_admin_id = $1 WHERE id = $2 RETURNING id, full_name`,
      [adminId, studentId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "סטודנט לא נמצא" });
      return;
    }

    res.json({ message: "סטודנט הוקצה בהצלחה", student: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// GET /api/admin/my-students - רשימת סטודנטים המוקצים לadmin זה
export async function getMyStudents(req: AuthRequest, res: Response) {
  const adminId = req.user!.userId;

  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.full_name,
        u.national_id,
        u.email,
        COUNT(DISTINCT qa.attempt_id) as total_attempts,
        COUNT(DISTINCT CASE WHEN qa.needs_grading = TRUE THEN qa.attempt_id END) as pending_grading
      FROM users u
      LEFT JOIN quiz_attempts_course qa ON qa.user_id = u.id
      WHERE u.assigned_admin_id = $1 AND u.role = 'STUDENT'
      GROUP BY u.id
      ORDER BY u.full_name ASC`,
      [adminId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}
