// ============================================================================
// בקר התקדמות (Progress Controller)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מנהל את מעקב ההתקדמות של תלמיד בקורס — חישוב אחוז ההשלמה וסימון/ביטול
//   סימון של פרקים כהושלמו.
//
// מה יש כאן (הפונקציות המיוצאות):
//   • getCourseProgress     — GET    .../progress: אחוז השלמה ורשימת פרקים.
//   • markChapterComplete   — POST   .../:chapterId/complete: סימון פרק כהושלם.
//   • unmarkChapterComplete — DELETE .../:chapterId/complete: ביטול הסימון.
//   • getMyOverview         — GET    /api/me/progress: סיכום התקדמות התלמיד
//                             בכל הקורסים (סרגל התקדמות אישי).
//   • getMyFeedback         — GET    /api/me/feedback: הערות המנהל על התשובות
//                             הפתוחות/קבצים שנבדקו לתלמיד.
//
// הקשר במערכת:
//   נקרא דרך progressRoutes (משתמש מחובר). ניגש לטבלאות chapters ו-user_progress.
//   הסימון משתמש ב-UPSERT (ON CONFLICT) לפי (user_id, chapter_id).
// ============================================================================

import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// GET /api/courses/:courseId/progress - התקדמות המשתמש בקורס
export async function getCourseProgress(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { courseId } = req.params;

  try {
    // כל הפרקים של הקורס
    const chaptersResult = await pool.query(
      "SELECT id FROM chapters WHERE course_id = $1 AND is_active = TRUE",
      [courseId]
    );
    const totalChapters = chaptersResult.rows.length;

    if (totalChapters === 0) {
      res.json({ total_chapters: 0, completed_chapters: 0, percent: 0, chapters: [] });
      return;
    }

    // התקדמות המשתמש
    const progressResult = await pool.query(
      `SELECT up.chapter_id, up.is_completed, up.completed_at, c.title, c.order_number
       FROM user_progress up
       JOIN chapters c ON c.id = up.chapter_id
       WHERE up.user_id = $1 AND c.course_id = $2
       ORDER BY c.order_number ASC`,
      [userId, courseId]
    );

    const completedChapters = progressResult.rows.filter((r) => r.is_completed).length;
    const percent = Math.round((completedChapters / totalChapters) * 100);

    res.json({
      total_chapters: totalChapters,
      completed_chapters: completedChapters,
      percent,
      chapters: progressResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// POST /api/courses/:courseId/chapters/:chapterId/complete - סימון פרק כהושלם
export async function markChapterComplete(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { courseId, chapterId } = req.params;

  try {
    // וידוא שהפרק שייך לקורס
    const chapter = await pool.query(
      "SELECT id FROM chapters WHERE id = $1 AND course_id = $2 AND is_active = TRUE",
      [chapterId, courseId]
    );
    if (chapter.rows.length === 0) {
      res.status(404).json({ error: "פרק לא נמצא" });
      return;
    }

    // INSERT או UPDATE אם כבר קיים
    const result = await pool.query(
      `INSERT INTO user_progress (user_id, chapter_id, is_completed, completed_at, progress_percent)
       VALUES ($1, $2, TRUE, NOW(), 100)
       ON CONFLICT (user_id, chapter_id)
       DO UPDATE SET is_completed = TRUE, completed_at = NOW(), progress_percent = 100
       RETURNING *`,
      [userId, chapterId]
    );

    res.json({ message: "פרק סומן כהושלם", progress: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// DELETE /api/courses/:courseId/chapters/:chapterId/complete - ביטול סימון
export async function unmarkChapterComplete(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { chapterId } = req.params;

  try {
    await pool.query(
      `UPDATE user_progress
       SET is_completed = FALSE, completed_at = NULL, progress_percent = 0
       WHERE user_id = $1 AND chapter_id = $2`,
      [userId, chapterId]
    );
    res.json({ message: "סימון הושלם בוטל" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// GET /api/me/progress - סיכום ההתקדמות האישית של התלמיד בכל הקורסים.
// לכל קורס: סך הפרקים הפעילים, כמה מהם הושלמו, ואחוז ההשלמה (לסרגל התקדמות).
// מחזיר רק קורסים שיש בהם פרקים פעילים.
export async function getMyOverview(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  try {
    const result = await pool.query(
      `SELECT
         c.id            AS course_id,
         c.title         AS course_title,
         COUNT(ch.id)                                              AS total_chapters,
         COUNT(up.chapter_id) FILTER (WHERE up.is_completed)       AS completed_chapters
       FROM courses c
       JOIN chapters ch ON ch.course_id = c.id AND ch.is_active = TRUE
       LEFT JOIN user_progress up
              ON up.chapter_id = ch.id AND up.user_id = $1
       GROUP BY c.id, c.title
       HAVING COUNT(ch.id) > 0
       ORDER BY c.title`,
      [userId]
    );

    // מחשבים אחוז השלמה בצד השרת כדי שהלקוח יקבל ערך מוכן לתצוגה
    const courses = result.rows.map((r) => {
      const total = Number(r.total_chapters);
      const done = Number(r.completed_chapters);
      return {
        course_id: r.course_id,
        course_title: r.course_title,
        total_chapters: total,
        completed_chapters: done,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });

    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// GET /api/me/feedback - הערות המנהל על התשובות שנבדקו לתלמיד.
// מחזיר כל תשובה פתוחה/קובץ שכבר נבדקה (needs_grading = FALSE) ויש עליה הערה
// או ניקוד, יחד עם טקסט השאלה, שם הקורס, הניקוד וההערה שכתב המנהל.
export async function getMyFeedback(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  try {
    const result = await pool.query(
      `SELECT
         qaa.id,
         c.title        AS course_title,
         q.question_text,
         qaa.free_text_answer,
         qaa.file_name,
         qaa.points_awarded,
         qaa.max_points,
         qaa.admin_comments,
         qa.submitted_at
       FROM quiz_attempt_answers qaa
       JOIN quiz_attempts_course qa ON qaa.attempt_id = qa.id
       JOIN questions q ON qaa.question_id = q.id
       JOIN courses c ON qa.course_id = c.id
       WHERE qa.user_id = $1
         AND qaa.needs_grading = FALSE
         AND qaa.admin_comments IS NOT NULL
       ORDER BY qa.submitted_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}
