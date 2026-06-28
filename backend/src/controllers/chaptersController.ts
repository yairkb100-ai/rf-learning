import { Request, Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// GET /api/courses/:courseId/chapters - כל הפרקים של קורס
export async function getChaptersByCourse(req: Request, res: Response) {
  const { courseId } = req.params;

  try {
    const course = await pool.query(
      "SELECT id FROM courses WHERE id = $1 AND is_active = TRUE",
      [courseId]
    );
    if (course.rows.length === 0) {
      res.status(404).json({ error: "קורס לא נמצא" });
      return;
    }

    const result = await pool.query(
      `SELECT id, course_id, title, description, order_number
       FROM chapters
       WHERE course_id = $1 AND is_active = TRUE
       ORDER BY order_number ASC`,
      [courseId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// GET /api/courses/:courseId/chapters/:id - פרק בודד
export async function getChapterById(req: Request, res: Response) {
  const { courseId, id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, course_id, title, description, order_number
       FROM chapters
       WHERE id = $1 AND course_id = $2 AND is_active = TRUE`,
      [id, courseId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "פרק לא נמצא" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// POST /api/courses/:courseId/chapters - יצירת פרק (מנהל בלבד)
export async function createChapter(req: AuthRequest, res: Response) {
  const { courseId } = req.params;
  const { title, description, order_number } = req.body;

  if (!title) {
    res.status(400).json({ error: "שם פרק חובה" });
    return;
  }

  try {
    const course = await pool.query(
      "SELECT id FROM courses WHERE id = $1",
      [courseId]
    );
    if (course.rows.length === 0) {
      res.status(404).json({ error: "קורס לא נמצא" });
      return;
    }

    // אם לא צוין מספר סדר — שים בסוף
    let orderNum = order_number;
    if (!orderNum) {
      const last = await pool.query(
        "SELECT MAX(order_number) as max FROM chapters WHERE course_id = $1",
        [courseId]
      );
      orderNum = (last.rows[0].max || 0) + 1;
    }

    const result = await pool.query(
      `INSERT INTO chapters (course_id, title, description, order_number)
       VALUES ($1, $2, $3, $4)
       RETURNING id, course_id, title, description, order_number`,
      [courseId, title, description || null, orderNum]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// PUT /api/courses/:courseId/chapters/:id - עדכון פרק (מנהל בלבד)
export async function updateChapter(req: AuthRequest, res: Response) {
  const { courseId, id } = req.params;
  const { title, description, order_number, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE chapters
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           order_number = COALESCE($3, order_number),
           is_active = COALESCE($4, is_active)
       WHERE id = $5 AND course_id = $6
       RETURNING id, course_id, title, description, order_number, is_active`,
      [title || null, description || null, order_number || null, is_active ?? null, id, courseId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "פרק לא נמצא" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// DELETE /api/courses/:courseId/chapters/:id - מחיקת פרק (מנהל בלבד)
export async function deleteChapter(req: AuthRequest, res: Response) {
  const { courseId, id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM chapters WHERE id = $1 AND course_id = $2 RETURNING id",
      [id, courseId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "פרק לא נמצא" });
      return;
    }
    res.json({ message: "פרק נמחק בהצלחה" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}
