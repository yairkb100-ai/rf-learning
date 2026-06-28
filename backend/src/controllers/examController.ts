import { Request, Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// סוגי שאלות נתמכים
type QuestionType = "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "FREE_TEXT";

// GET /api/courses/:courseId/chapters/:chapterId/questions - כל השאלות של פרק (מנהל)
export async function getQuestions(req: AuthRequest, res: Response) {
  const { chapterId } = req.params;

  try {
    const result = await pool.query(
      `SELECT q.id, q.question_type, q.question_text, q.explanation, q.hint,
              q.video_url, q.model_answer,
              COALESCE(
                json_agg(json_build_object(
                  'id', o.id,
                  'answer_text', o.answer_text,
                  'is_correct', o.is_correct
                ) ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL),
                '[]'
              ) AS options
       FROM questions q
       LEFT JOIN question_options o ON o.question_id = q.id
       WHERE q.chapter_id = $1
       GROUP BY q.id
       ORDER BY q.id ASC`,
      [chapterId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// GET /api/courses/:courseId/chapters/:chapterId/exam - שאלות המבחן (ללא is_correct - לתלמיד)
export async function getExam(req: Request, res: Response) {
  const { chapterId } = req.params;

  try {
    const result = await pool.query(
      `SELECT q.id, q.question_type, q.question_text, q.hint, q.video_url,
              COALESCE(
                json_agg(json_build_object(
                  'id', o.id,
                  'answer_text', o.answer_text
                ) ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL),
                '[]'
              ) AS options
       FROM questions q
       LEFT JOIN question_options o ON o.question_id = q.id
       WHERE q.chapter_id = $1
       GROUP BY q.id
       ORDER BY q.id ASC`,
      [chapterId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "אין שאלות לפרק זה עדיין" });
      return;
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// POST /api/courses/:courseId/chapters/:chapterId/questions - יצירת שאלה (מנהל)
export async function createQuestion(req: AuthRequest, res: Response) {
  const { courseId, chapterId } = req.params;
  const {
    question_type = "MULTIPLE_CHOICE",
    question_text,
    explanation,
    hint,
    video_url,
    model_answer,
    options,
  } = req.body as {
    question_type?: QuestionType;
    question_text?: string;
    explanation?: string;
    hint?: string;
    video_url?: string;
    model_answer?: string;
    options?: { answer_text: string; is_correct: boolean }[];
  };

  if (!question_text) {
    res.status(400).json({ error: "נוסח שאלה חובה" });
    return;
  }

  const isChoice =
    question_type === "MULTIPLE_CHOICE" || question_type === "MULTIPLE_SELECT";

  if (isChoice) {
    if (!options || options.length < 2) {
      res.status(400).json({ error: "שאלה ולפחות 2 תשובות חובה" });
      return;
    }
    const correctCount = options.filter((o) => o.is_correct === true).length;
    if (correctCount === 0) {
      res.status(400).json({ error: "חייבת להיות לפחות תשובה נכונה אחת" });
      return;
    }
    if (question_type === "MULTIPLE_CHOICE" && correctCount !== 1) {
      res
        .status(400)
        .json({ error: "בשאלה אמריקאית חייבת להיות בדיוק תשובה נכונה אחת" });
      return;
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const qResult = await client.query(
      `INSERT INTO questions
         (course_id, chapter_id, question_type, question_text, explanation, hint, video_url, model_answer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        courseId,
        chapterId,
        question_type,
        question_text,
        explanation || null,
        hint || null,
        video_url || null,
        model_answer || null,
      ]
    );
    const questionId = qResult.rows[0].id;

    if (isChoice && options) {
      for (const opt of options) {
        await client.query(
          `INSERT INTO question_options (question_id, answer_text, is_correct)
           VALUES ($1, $2, $3)`,
          [questionId, opt.answer_text, opt.is_correct === true]
        );
      }
    }

    await client.query("COMMIT");

    const full = await pool.query(
      `SELECT q.id, q.question_type, q.question_text, q.explanation, q.hint,
              q.video_url, q.model_answer,
              COALESCE(
                json_agg(json_build_object(
                  'id', o.id, 'answer_text', o.answer_text, 'is_correct', o.is_correct
                ) ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL),
                '[]'
              ) AS options
       FROM questions q
       LEFT JOIN question_options o ON o.question_id = q.id
       WHERE q.id = $1 GROUP BY q.id`,
      [questionId]
    );

    res.status(201).json(full.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  } finally {
    client.release();
  }
}

// DELETE /api/courses/:courseId/chapters/:chapterId/questions/:id - מחיקת שאלה (מנהל)
export async function deleteQuestion(req: AuthRequest, res: Response) {
  const { chapterId, id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM questions WHERE id = $1 AND chapter_id = $2 RETURNING id",
      [id, chapterId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "שאלה לא נמצאה" });
      return;
    }
    res.json({ message: "שאלה נמחקה" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// POST /api/courses/:courseId/chapters/:chapterId/exam/submit - הגשת מבחן
export async function submitExam(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { courseId, chapterId } = req.params;
  // answers: [{ question_id, selected_option_ids?: number[], free_text?: string }]
  const { answers } = req.body as {
    answers?: {
      question_id: number;
      selected_option_ids?: number[];
      free_text?: string;
    }[];
  };

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    res.status(400).json({ error: "חובה לשלוח תשובות" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // נטען את כל השאלות של הפרק + התשובות הנכונות שלהן
    const qRes = await client.query(
      `SELECT q.id, q.question_type,
              COALESCE(
                json_agg(json_build_object('id', o.id, 'is_correct', o.is_correct)
                  ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL),
                '[]'
              ) AS options
       FROM questions q
       LEFT JOIN question_options o ON o.question_id = q.id
       WHERE q.chapter_id = $1
       GROUP BY q.id`,
      [chapterId]
    );

    const questionMap = new Map<number, any>();
    for (const row of qRes.rows) questionMap.set(Number(row.id), row);

    let earnedPoints = 0; // נקודות שנצברו (מתוך השאלות האוטומטיות)
    let autoMaxPoints = 0; // סך נקודות מקסימלי של השאלות האוטומטיות
    let needsReview = false;
    const answerRows: any[] = [];

    for (const ans of answers) {
      const q = questionMap.get(Number(ans.question_id));
      if (!q) continue;

      const qType: QuestionType = q.question_type;
      const correctIds: number[] = q.options
        .filter((o: any) => o.is_correct)
        .map((o: any) => Number(o.id));
      const selectedIds = (ans.selected_option_ids || []).map(Number);

      if (qType === "FREE_TEXT") {
        // שאלה פתוחה — לא מנוקדת אוטומטית, ממתינה לבדיקת מנהל
        needsReview = true;
        answerRows.push({
          question_id: q.id,
          question_type: qType,
          selected_option_id: null,
          free_text_answer: ans.free_text || "",
          points_awarded: 0,
          max_points: 1,
          needs_grading: true,
        });
        continue;
      }

      if (qType === "MULTIPLE_CHOICE") {
        autoMaxPoints += 1;
        const chosen = selectedIds[0] ?? null;
        const isCorrect = chosen !== null && correctIds.includes(chosen);
        if (isCorrect) earnedPoints += 1;
        answerRows.push({
          question_id: q.id,
          question_type: qType,
          selected_option_id: chosen,
          free_text_answer: null,
          points_awarded: isCorrect ? 1 : 0,
          max_points: 1,
          needs_grading: false,
        });
        continue;
      }

      if (qType === "MULTIPLE_SELECT") {
        // ניקוד חלקי: (נכונות שסומנו - שגויות שסומנו) / סך הנכונות, מינימום 0
        autoMaxPoints += 1;
        const correctSelected = selectedIds.filter((id) =>
          correctIds.includes(id)
        ).length;
        const wrongSelected = selectedIds.filter(
          (id) => !correctIds.includes(id)
        ).length;
        const raw = (correctSelected - wrongSelected) / correctIds.length;
        const fraction = Math.max(0, Math.min(1, raw));
        const pts = parseFloat(fraction.toFixed(2));
        earnedPoints += pts;
        // נשמור רק שורה אחת לכל אופציה שנבחרה, או שורה אחת כללית עם הניקוד
        answerRows.push({
          question_id: q.id,
          question_type: qType,
          selected_option_id: selectedIds[0] ?? null,
          free_text_answer:
            selectedIds.length > 1 ? JSON.stringify(selectedIds) : null,
          points_awarded: pts,
          max_points: 1,
          needs_grading: false,
        });
        continue;
      }
    }

    // ציון זמני מבוסס רק על השאלות האוטומטיות (פתוחות נבדקות ידנית בהמשך)
    const totalQuestions = answers.length;
    const score =
      autoMaxPoints > 0
        ? parseFloat(((earnedPoints / autoMaxPoints) * 100).toFixed(2))
        : 0;

    const status = needsReview ? "PENDING_REVIEW" : "GRADED";

    const attemptResult = await client.query(
      `INSERT INTO quiz_attempts_course (user_id, course_id, score, status)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, courseId, score, status]
    );
    const attemptId = attemptResult.rows[0].id;

    for (const ar of answerRows) {
      await client.query(
        `INSERT INTO quiz_attempt_answers
           (attempt_id, question_id, selected_option_id, free_text_answer,
            points_awarded, max_points, needs_grading, question_type, is_correct)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          attemptId,
          ar.question_id,
          ar.selected_option_id,
          ar.free_text_answer,
          ar.points_awarded,
          ar.max_points,
          ar.needs_grading,
          ar.question_type,
          ar.points_awarded >= ar.max_points,
        ]
      );
    }

    await client.query("COMMIT");

    const passed = !needsReview && score >= 60;

    res.status(201).json({
      attempt_id: attemptId,
      score,
      total: totalQuestions,
      passed,
      pending_review: needsReview,
      message: needsReview
        ? "המבחן הוגש! חלק מהשאלות ממתינות לבדיקת מנהל — הציון הסופי יתעדכן בהמשך."
        : passed
        ? "עברת את המבחן בהצלחה!"
        : "לא עברת — נסה שוב",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  } finally {
    client.release();
  }
}

// GET /api/courses/:courseId/chapters/:chapterId/exam/results - היסטוריית ניסיונות
export async function getExamResults(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { courseId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, score, status, submitted_at,
              CASE WHEN status = 'GRADED' AND score >= 60 THEN true ELSE false END AS passed
       FROM quiz_attempts_course
       WHERE user_id = $1 AND course_id = $2
       ORDER BY submitted_at DESC`,
      [userId, courseId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}
