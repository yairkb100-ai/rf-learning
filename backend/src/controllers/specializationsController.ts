import { Request, Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// GET /api/specializations - כל המגמות הפעילות (כולל ספירת קורסים)
export async function getAllSpecializations(_req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.description,
              COUNT(c.id) FILTER (WHERE c.is_active) AS course_count
       FROM specializations s
       LEFT JOIN courses c ON c.specialization_id = s.id
       WHERE s.is_active = TRUE
       GROUP BY s.id
       ORDER BY s.name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// POST /api/specializations - יצירת מגמה (מנהל)
export async function createSpecialization(req: AuthRequest, res: Response) {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: "שם מגמה חובה" });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO specializations (name, description)
       VALUES ($1, $2) RETURNING id, name, description`,
      [name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "מגמה עם שם זה כבר קיימת" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// PUT /api/specializations/:id - עדכון מגמה (מנהל)
export async function updateSpecialization(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE specializations
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           is_active = COALESCE($3, is_active)
       WHERE id = $4
       RETURNING id, name, description, is_active`,
      [name || null, description || null, is_active ?? null, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "מגמה לא נמצאה" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// DELETE /api/specializations/:id - מחיקת מגמה (מנהל)
// הקורסים המשויכים הופכים לכלליים (specialization_id -> NULL דרך ON DELETE SET NULL).
export async function deleteSpecialization(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM specializations WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "מגמה לא נמצאה" });
      return;
    }
    res.json({ message: "המגמה נמחקה (הקורסים שלה הפכו לכלליים)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}
