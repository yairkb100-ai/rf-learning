import { Request, Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// GET /api/courses - קורסים פעילים, מסוננים לפי הרשאות והמגמה של המשתמש.
// פרמטרי שאילתה אופציונליים:
//   ?specialization_id=<id>  - רק קורסי מגמה מסוימת
//   ?general=1               - רק קורסים כלליים (ללא מגמה)
// כללי גישה:
//   מנהל — רואה את כל הקורסים.
//   תלמיד — רואה קורסים כלליים + קורסי המגמה שלו בלבד.
//   אנונימי — קורסים כלליים בלבד.
export async function getAllCourses(req: AuthRequest, res: Response) {
  const { specialization_id, general } = req.query;
  try {
    let userSpec: number | null = null;
    let isAdmin = false;
    if (req.user) {
      isAdmin = req.user.role === "ADMIN";
      const u = await pool.query(
        "SELECT specialization_id FROM users WHERE id = $1",
        [req.user.userId]
      );
      userSpec = u.rows[0]?.specialization_id ?? null;
    }

    const conditions: string[] = ["c.is_active = TRUE"];
    const params: any[] = [];

    // סינון הרשאות — מנהל מדלג על המגבלה
    if (!isAdmin) {
      if (userSpec !== null) {
        params.push(userSpec);
        conditions.push(`(c.specialization_id IS NULL OR c.specialization_id = $${params.length})`);
      } else {
        conditions.push("c.specialization_id IS NULL");
      }
    }

    // פילטרים מפורשים מה-UI
    if (general === "1") {
      conditions.push("c.specialization_id IS NULL");
    } else if (specialization_id) {
      params.push(Number(specialization_id));
      conditions.push(`c.specialization_id = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.specialization_id, c.created_at
       FROM courses c
       WHERE ${conditions.join(" AND ")}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// GET /api/courses/:id - קורס בודד
export async function getCourseById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, title, description, created_at
       FROM courses
       WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "קורס לא נמצא" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// POST /api/courses - יצירת קורס (מנהל בלבד)
export async function createCourse(req: AuthRequest, res: Response) {
  const { title, description, specialization_id } = req.body;

  if (!title) {
    res.status(400).json({ error: "שם קורס חובה" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO courses (title, description, specialization_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, description, specialization_id, created_at`,
      [title, description || null, specialization_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "קורס עם שם זה כבר קיים" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// PUT /api/courses/:id - עדכון קורס (מנהל בלבד)
export async function updateCourse(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { title, description, is_active, specialization_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           is_active = COALESCE($3, is_active),
           specialization_id = CASE WHEN $4::boolean THEN $5 ELSE specialization_id END
       WHERE id = $6
       RETURNING id, title, description, is_active, specialization_id`,
      [
        title || null,
        description || null,
        is_active ?? null,
        // מאפשר גם לאפס למגמה NULL (כללי) רק כשהשדה נשלח במפורש
        specialization_id !== undefined,
        specialization_id ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "קורס לא נמצא" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// DELETE /api/courses/:id - מחיקת קורס (מנהל בלבד)
export async function deleteCourse(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM courses WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "קורס לא נמצא" });
      return;
    }
    res.json({ message: "קורס נמחק בהצלחה" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}
