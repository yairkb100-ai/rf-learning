// ============================================================================
// בקר פעולות מנהל — שכפול והעברת תוכן (Admin Ops Controller)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מרכז פעולות ניהול מורכבות של שכפול והעברת תוכן לימודי — מגמות, קורסים
//   ופרקים — כולל כל התוכן והשאלות התלויים בהם. כל פעולה רצה בטרנזקציה.
//
// מה יש כאן (הפונקציות המיוצאות):
//   • duplicateCourse         — POST /api/admin/courses/:id/duplicate
//   • moveChapter             — PUT  /api/admin/chapters/:id/move
//   • duplicateChapter        — POST /api/admin/chapters/:id/duplicate
//   • duplicateSpecialization — POST /api/admin/specializations/:id/duplicate
//
// עזרי פנים: copyChapterChildren (תוכן+שאלות של פרק), copyCourse (קורס לעומק).
//
// הקשר במערכת:
//   נקרא דרך adminOpsRoutes (מנהל בלבד). ניגש לטבלאות: specializations,
//   courses, chapters, learning_content, questions, question_options.
//   כל השכפולים עוטפים BEGIN/COMMIT ומבצעים ROLLBACK בכשל.
// ============================================================================

import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// משכפל את כל התוכן (learning_content) והשאלות (questions + options) של פרק מקור לפרק יעד.
// משמש גם בשכפול קורס וגם בשכפול/העברת פרק.
async function copyChapterChildren(
  client: any,
  srcChapterId: number,
  destChapterId: number,
  destCourseId: number
) {
  // 1) learning_content
  await client.query(
    `INSERT INTO learning_content (course_id, chapter_id, content_type, title, content, extra, sort_order)
     SELECT NULL, $1, content_type, title, content, extra, sort_order
     FROM learning_content WHERE chapter_id = $2`,
    [destChapterId, srcChapterId]
  );

  // 2) questions — מעתיק שאלה-שאלה כדי לשכפל גם את האפשרויות עם מיפוי ה-id החדש
  const qs = await client.query(
    `SELECT id, question_type, question_text, explanation, hint, model_answer
     FROM questions WHERE chapter_id = $1`,
    [srcChapterId]
  );
  for (const q of qs.rows) {
    const nq = await client.query(
      `INSERT INTO questions (course_id, chapter_id, question_type, question_text, explanation, hint, model_answer)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [destCourseId, destChapterId, q.question_type, q.question_text, q.explanation, q.hint, q.model_answer]
    );
    await client.query(
      `INSERT INTO question_options (question_id, answer_text, is_correct)
       SELECT $1, answer_text, is_correct FROM question_options WHERE question_id = $2`,
      [nq.rows[0].id, q.id]
    );
  }
}

// משכפל קורס שלם (פרקים+תוכן+שאלות). מחזיר את הקורס החדש. חייב לרוץ בתוך טרנזקציה.
async function copyCourse(
  client: any,
  srcCourseId: number,
  opts: { title?: string; specialization_id?: number | null } = {}
) {
  const src = await client.query("SELECT * FROM courses WHERE id = $1", [srcCourseId]);
  const course = src.rows[0];
  const newCourse = await client.query(
    `INSERT INTO courses (title, description, is_active, specialization_id)
     VALUES ($1,$2,$3,$4) RETURNING id, title`,
    [
      opts.title || `${course.title} (עותק)`,
      course.description,
      course.is_active,
      opts.specialization_id !== undefined ? opts.specialization_id : course.specialization_id,
    ]
  );
  const newCourseId = newCourse.rows[0].id;

  const chapters = await client.query(
    "SELECT * FROM chapters WHERE course_id = $1 ORDER BY order_number, id",
    [srcCourseId]
  );
  for (const ch of chapters.rows) {
    const nch = await client.query(
      `INSERT INTO chapters (course_id, title, description, order_number, is_active)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [newCourseId, ch.title, ch.description, ch.order_number, ch.is_active]
    );
    await copyChapterChildren(client, ch.id, nch.rows[0].id, newCourseId);
  }
  return { id: newCourseId, title: newCourse.rows[0].title };
}

// POST /api/admin/courses/:id/duplicate
// body: { title?, specialization_id? }  — יוצר עותק מלא של הקורס (פרקים+תוכן+שאלות)
export async function duplicateCourse(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { title, specialization_id } = req.body as {
    title?: string;
    specialization_id?: number | null;
  };

  const client = await pool.connect();
  try {
    const src = await client.query("SELECT id FROM courses WHERE id = $1", [id]);
    if (src.rows.length === 0) {
      res.status(404).json({ error: "קורס לא נמצא" });
      return;
    }

    await client.query("BEGIN");
    const copy = await copyCourse(client, Number(id), { title, specialization_id });
    await client.query("COMMIT");
    res.status(201).json({ id: copy.id, title: copy.title, message: "הקורס שוכפל בהצלחה" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת בשכפול הקורס" });
  } finally {
    client.release();
  }
}

// PUT /api/admin/chapters/:id/move   body: { target_course_id }
// מעביר פרק קיים (כולל התוכן והשאלות שלו) לקורס אחר.
export async function moveChapter(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { target_course_id } = req.body as { target_course_id?: number };

  if (!target_course_id) {
    res.status(400).json({ error: "חובה לציין קורס יעד" });
    return;
  }

  const client = await pool.connect();
  try {
    const ch = await client.query("SELECT id FROM chapters WHERE id = $1", [id]);
    if (ch.rows.length === 0) {
      res.status(404).json({ error: "פרק לא נמצא" });
      return;
    }
    const target = await client.query("SELECT id FROM courses WHERE id = $1", [target_course_id]);
    if (target.rows.length === 0) {
      res.status(404).json({ error: "קורס היעד לא נמצא" });
      return;
    }

    await client.query("BEGIN");
    // מספר סדר בסוף קורס היעד
    const last = await client.query(
      "SELECT COALESCE(MAX(order_number),0)+1 AS n FROM chapters WHERE course_id = $1",
      [target_course_id]
    );
    await client.query(
      "UPDATE chapters SET course_id = $1, order_number = $2 WHERE id = $3",
      [target_course_id, last.rows[0].n, id]
    );
    // השאלות נושאות גם course_id — מעדכנים לעקביות
    await client.query(
      "UPDATE questions SET course_id = $1 WHERE chapter_id = $2",
      [target_course_id, id]
    );
    await client.query("COMMIT");
    res.json({ message: "הפרק הועבר לקורס היעד" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת בהעברת הפרק" });
  } finally {
    client.release();
  }
}

// POST /api/admin/chapters/:id/duplicate   body: { target_course_id? }
// משכפל פרק (כולל תוכן ושאלות) — לאותו קורס או לקורס אחר.
export async function duplicateChapter(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { target_course_id } = req.body as { target_course_id?: number };

  const client = await pool.connect();
  try {
    const src = await client.query("SELECT * FROM chapters WHERE id = $1", [id]);
    if (src.rows.length === 0) {
      res.status(404).json({ error: "פרק לא נמצא" });
      return;
    }
    const ch = src.rows[0];
    const destCourseId = target_course_id || ch.course_id;

    const target = await client.query("SELECT id FROM courses WHERE id = $1", [destCourseId]);
    if (target.rows.length === 0) {
      res.status(404).json({ error: "קורס היעד לא נמצא" });
      return;
    }

    await client.query("BEGIN");
    const last = await client.query(
      "SELECT COALESCE(MAX(order_number),0)+1 AS n FROM chapters WHERE course_id = $1",
      [destCourseId]
    );
    const nch = await client.query(
      `INSERT INTO chapters (course_id, title, description, order_number, is_active)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, title`,
      [
        destCourseId,
        destCourseId === ch.course_id ? `${ch.title} (עותק)` : ch.title,
        ch.description,
        last.rows[0].n,
        ch.is_active,
      ]
    );
    await copyChapterChildren(client, ch.id, nch.rows[0].id, destCourseId);
    await client.query("COMMIT");
    res.status(201).json({ id: nch.rows[0].id, title: nch.rows[0].title, message: "הפרק שוכפל בהצלחה" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת בשכפול הפרק" });
  } finally {
    client.release();
  }
}

// POST /api/admin/specializations/:id/duplicate   body: { name? }
// משכפל מגמה שלמה כולל כל הקורסים שלה (כל קורס משוכפל לעומק).
export async function duplicateSpecialization(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name } = req.body as { name?: string };

  const client = await pool.connect();
  try {
    const src = await client.query("SELECT * FROM specializations WHERE id = $1", [id]);
    if (src.rows.length === 0) {
      res.status(404).json({ error: "מגמה לא נמצאה" });
      return;
    }
    const spec = src.rows[0];

    await client.query("BEGIN");
    const newSpec = await client.query(
      `INSERT INTO specializations (name, description, is_active)
       VALUES ($1,$2,$3) RETURNING id, name`,
      [name || `${spec.name} (עותק)`, spec.description, spec.is_active]
    );
    const newSpecId = newSpec.rows[0].id;

    // שכפול כל הקורסים של המגמה לתוך המגמה החדשה
    const courses = await client.query(
      "SELECT id FROM courses WHERE specialization_id = $1 ORDER BY id",
      [id]
    );
    for (const c of courses.rows) {
      await copyCourse(client, Number(c.id), { specialization_id: newSpecId });
    }

    await client.query("COMMIT");
    res.status(201).json({
      id: newSpecId,
      name: newSpec.rows[0].name,
      courses_copied: courses.rows.length,
      message: "המגמה שוכפלה בהצלחה",
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת בשכפול המגמה" });
  } finally {
    client.release();
  }
}
