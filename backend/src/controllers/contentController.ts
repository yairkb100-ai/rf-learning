// ============================================================================
// בקר חומר לימוד (Content Controller)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מטפל בבלוקי חומר הלימוד (learning_content) — טקסט עשיר (RICH), קישורים,
//   ותמונות/וידאו/קבצים שהועלו. חומר יכול להיות ברמת הקורס (מבוא) או ברמת פרק.
//
// מה יש כאן (הפונקציות המיוצאות):
//   • getCourseContent    — GET    .../content: שליפת חומר (של פרק או של קורס).
//   • addCourseContent    — POST   .../content: הוספת בלוק תוכן (מנהל, כולל קובץ).
//   • updateCourseContent — PUT    .../content/:id: עריכה + החלפת קובץ (מנהל).
//   • deleteCourseContent — DELETE .../content/:id: מחיקה + ניקוי קבצים (מנהל).
//
// עזר פנים: unlinkUpload — מחיקה שקטה של קובץ שהועלה מהדיסק.
//
// הקשר במערכת:
//   נקרא דרך contentRoutes. ניגש לטבלת learning_content. ההעלאות מגיעות
//   מ-multer (config/upload) בשדות "file" ו-"image", ונשמרות תחת /uploads.
// ============================================================================

import { Request, Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";
import path from "path";
import fs from "fs";

// מוחק קובץ שהועלה מהדיסק (שקט) אם הנתיב הוא /uploads/...
function unlinkUpload(p: string | null | undefined) {
  if (p && p.startsWith("/uploads/")) {
    fs.unlink(path.join(__dirname, "..", "..", p), () => {});
  }
}

// GET content - חומר לימוד של קורס (מבוא) או של פרק
// אם יש chapterId בנתיב — מחזיר את חומר הפרק; אחרת את חומר הקורס.
export async function getCourseContent(req: Request, res: Response) {
  const { courseId, chapterId } = req.params;
  try {
    const result = chapterId
      ? await pool.query(
          `SELECT id, content_type, title, content, extra, sort_order
           FROM learning_content
           WHERE chapter_id = $1
           ORDER BY sort_order ASC, id ASC`,
          [chapterId]
        )
      : await pool.query(
          `SELECT id, content_type, title, content, extra, sort_order
           FROM learning_content
           WHERE course_id = $1 AND chapter_id IS NULL
           ORDER BY sort_order ASC, id ASC`,
          [courseId]
        );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// POST content - הוספת חומר (מנהל)
// תומך בטקסט/קישור (JSON), קובץ בודד (multipart), ו-RICH (טקסט + תמונה יחד).
export async function addCourseContent(req: AuthRequest, res: Response) {
  const { courseId, chapterId } = req.params;
  const { content_type, title, content, sort_order } = req.body;

  if (!content_type || !title) {
    res.status(400).json({ error: "סוג ותיאור חובה" });
    return;
  }

  // קובץ בודד הגיע תחת השדה "file"; ב-RICH התמונה תחת "image".
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const singleFile = req.file || files?.file?.[0];
  const imageFile = files?.image?.[0];

  let finalContent = content;
  let extra: string | null = null;

  if (content_type === "RICH") {
    // RICH: content = טקסט, extra = נתיב התמונה (אם הועלתה)
    if (imageFile) extra = `/uploads/${imageFile.filename}`;
    if (!finalContent && !extra) {
      res.status(400).json({ error: "יש להזין טקסט או תמונה" });
      return;
    }
    finalContent = finalContent || "";
  } else {
    // שאר הסוגים — קובץ בודד הופך ל-content
    if (singleFile) finalContent = `/uploads/${singleFile.filename}`;
    if (!finalContent) {
      res.status(400).json({ error: "חובה תוכן (טקסט, קישור או קובץ)" });
      return;
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO learning_content (course_id, chapter_id, content_type, title, content, extra, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, content_type, title, content, extra, sort_order`,
      [
        chapterId ? null : courseId,
        chapterId || null,
        content_type,
        title,
        finalContent,
        extra,
        sort_order || 1,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// PUT content/:id - עריכת חומר קיים (מנהל)
// אפשר לעדכן כותרת/טקסט; ב-RICH אפשר להחליף תמונה (image) או להשאיר.
// בסוגי קובץ אפשר להחליף קובץ (file) או להשאיר את הקיים.
export async function updateCourseContent(req: AuthRequest, res: Response) {
  const { courseId, chapterId, id } = req.params;
  const { title, content } = req.body;

  try {
    // שליפת הפריט הקיים (כולל בדיקת שייכות)
    const existing = chapterId
      ? await pool.query(
          "SELECT content_type, content, extra FROM learning_content WHERE id = $1 AND chapter_id = $2",
          [id, chapterId]
        )
      : await pool.query(
          "SELECT content_type, content, extra FROM learning_content WHERE id = $1 AND course_id = $2 AND chapter_id IS NULL",
          [id, courseId]
        );

    if (existing.rows.length === 0) {
      res.status(404).json({ error: "חומר לא נמצא" });
      return;
    }

    const row = existing.rows[0];
    const type = row.content_type as string;

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const singleFile = req.file || files?.file?.[0];
    const imageFile = files?.image?.[0];

    let newContent = row.content;
    let newExtra = row.extra;

    if (type === "RICH") {
      // עדכון הטקסט אם נשלח; החלפת תמונה אם הועלתה חדשה
      if (content !== undefined) newContent = content;
      if (imageFile) {
        unlinkUpload(row.extra); // מחיקת התמונה הישנה
        newExtra = `/uploads/${imageFile.filename}`;
      }
    } else if (singleFile) {
      // החלפת קובץ — מחיקת הישן
      unlinkUpload(row.content);
      newContent = `/uploads/${singleFile.filename}`;
    } else if (content !== undefined) {
      // טקסט/קישור — עדכון הערך
      newContent = content;
    }

    const result = await pool.query(
      `UPDATE learning_content
       SET title = COALESCE($1, title), content = $2, extra = $3
       WHERE id = $4
       RETURNING id, content_type, title, content, extra, sort_order`,
      [title || null, newContent, newExtra, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// DELETE content/:id - מחיקת חומר (מנהל)
export async function deleteCourseContent(req: AuthRequest, res: Response) {
  const { courseId, chapterId, id } = req.params;
  try {
    const result = chapterId
      ? await pool.query(
          "DELETE FROM learning_content WHERE id = $1 AND chapter_id = $2 RETURNING content, extra",
          [id, chapterId]
        )
      : await pool.query(
          "DELETE FROM learning_content WHERE id = $1 AND course_id = $2 RETURNING content, extra",
          [id, courseId]
        );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "חומר לא נמצא" });
      return;
    }

    // מחיקת קבצים שהועלו (content ו/או extra)
    unlinkUpload(result.rows[0].content);
    unlinkUpload(result.rows[0].extra);

    res.json({ message: "החומר נמחק" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}
