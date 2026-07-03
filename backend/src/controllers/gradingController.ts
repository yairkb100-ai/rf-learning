import { Request, Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// GET /api/admin/grading/pending - רשימת שאלות הממתינות לבדיקה
export async function getPendingGrading(req: AuthRequest, res: Response) {
  const adminId = req.user!.userId;

  try {
    // רשימה של שאלות שממתינות לבדיקה של admin זה
    const result = await pool.query(
      `SELECT
        gq.id,
        gq.attempt_id,
        gq.question_id,
        gq.student_id,
        u.full_name AS student_name,
        u.national_id,
        c.title AS course_title,
        q.question_text,
        q.question_type,
        q.model_answer,
        qaa.free_text_answer,
        qaa.file_path,
        qaa.file_name,
        gq.created_at,
        gq.status
      FROM grading_queue gq
      JOIN users u ON gq.student_id = u.id
      JOIN quiz_attempts_course qa ON gq.attempt_id = qa.id
      JOIN courses c ON qa.course_id = c.id
      JOIN questions q ON gq.question_id = q.id
      JOIN quiz_attempt_answers qaa ON qaa.attempt_id = gq.attempt_id AND qaa.question_id = gq.question_id
      WHERE gq.admin_id = $1 AND gq.status IN ('PENDING', 'IN_PROGRESS')
      ORDER BY gq.created_at ASC`,
      [adminId]
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

    // קבל את הdetails של grading_queue
    const gqResult = await client.query(
      `SELECT attempt_id, question_id, student_id, admin_id FROM grading_queue WHERE id = $1`,
      [gradeId]
    );

    if (gqResult.rows.length === 0) {
      res.status(404).json({ error: "פריט grading לא נמצא" });
      return;
    }

    const { attempt_id, question_id, student_id, admin_id: queue_admin } = gqResult.rows[0];

    if (Number(queue_admin) !== adminId) {
      res.status(403).json({ error: "אינך מורשה לבדוק פריט זה" });
      return;
    }

    // קבל את הניקוד הישן
    const oldScore = await client.query(
      `SELECT points_awarded FROM quiz_attempt_answers WHERE attempt_id = $1 AND question_id = $2`,
      [attempt_id, question_id]
    );

    const oldPoints = oldScore.rows[0]?.points_awarded || 0;
    const newPoints = score; // score הוא 0-100, נממיר ל-0-1 scale

    // עדכן את הניקוד בquiz_attempt_answers
    await client.query(
      `UPDATE quiz_attempt_answers
       SET points_awarded = $1, grading_status = 'GRADED', graded_by = $2, graded_at = CURRENT_TIMESTAMP,
           admin_comments = $3, needs_grading = FALSE
       WHERE attempt_id = $4 AND question_id = $5`,
      [newPoints, adminId, comments || null, attempt_id, question_id]
    );

    // עדכן את grading_queue
    await client.query(
      `UPDATE grading_queue SET status = 'GRADED' WHERE id = $1`,
      [gradeId]
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

// GET /api/admin/grading/history/:studentId - היסטוריית ניקוד של סטודנט
export async function getGradingHistory(req: AuthRequest, res: Response) {
  const adminId = req.user!.userId;
  const { studentId } = req.params;

  try {
    // בדוק שהstudent assigned לadmin הזה
    const assignedResult = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND assigned_admin_id = $2`,
      [studentId, adminId]
    );

    if (assignedResult.rows.length === 0) {
      res.status(403).json({ error: "אינך מורשה לראות סטודנט זה" });
      return;
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
