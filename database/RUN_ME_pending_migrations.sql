-- ============================================================
-- ⚠️ הרץ אותי ב-pgAdmin (Query Tool, DB = rf_learning)
-- ============================================================
-- קובץ זה מאחד את כל המיגרציות של שלב 3 שעדיין לא רצו.
-- אבחון (2026-06-26) הראה שרק חלק מהמיגרציות רצו בפועל:
--   ✅ רץ כבר: content_type enum (RICH), learning_content.extra,
--             learning_content.chapter_id, וה-CASCADE על quiz_attempt_answers.
--   ❌ עדיין חסר: question_type enum (MULTIPLE_SELECT/FREE_TEXT),
--             questions.chapter_id/video_url/model_answer,
--             וכל העמודות החדשות ב-quiz_attempt_answers + quiz_attempts_course.
--
-- כל הפקודות כאן idempotent — בטוח להריץ שוב גם אם חלק כבר קיים.
--
-- 🔴 חשוב מאוד — סדר הרצה (בגלל מגבלת ALTER TYPE ב-PostgreSQL):
--   שלב א': סמן והרץ אך ורק את 2 שורות ה-ALTER TYPE שבסעיף 1.
--   שלב ב': אחר כך סמן והרץ את כל השאר (מסעיף 2 ואילך).
--   אי אפשר להוסיף ערך ל-enum ולהשתמש בו באותה טרנזקציה.
-- ============================================================


-- ===== שלב א' — הרץ את 2 השורות האלה לבד תחילה =====
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'MULTIPLE_SELECT';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'FREE_TEXT';


-- ===== שלב ב' — הרץ את כל מה שמכאן ומטה =====

-- 2) questions: שיוך לפרק + וידאו + תשובת מודל לשאלה פתוחה
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter_id BIGINT
  REFERENCES chapters(id) ON DELETE CASCADE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS model_answer TEXT;
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);

-- 3) quiz_attempt_answers: תמיכה בטקסט חופשי + בחירה מרובה + בדיקה ידנית
ALTER TABLE quiz_attempt_answers ALTER COLUMN selected_option_id DROP NOT NULL;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS free_text_answer TEXT;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS points_awarded DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS max_points DECIMAL(5,2) NOT NULL DEFAULT 1;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS needs_grading BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS question_type question_type NOT NULL DEFAULT 'MULTIPLE_CHOICE';

-- 4) quiz_attempts_course: סטטוס מבחן (GRADED / PENDING_REVIEW)
ALTER TABLE quiz_attempts_course ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'GRADED';

-- 5) (כבר רצו, אבל לבטחון — idempotent) content עשיר + שיוך פרק
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'RICH';  -- אם נכשל "כבר קיים" — התעלם
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS extra TEXT;
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS chapter_id BIGINT
  REFERENCES chapters(id) ON DELETE CASCADE;

-- 6) (כבר רץ דרך סקריפט) FK CASCADE כדי שמחיקת קורס/פרק/שאלה תעבוד
ALTER TABLE quiz_attempt_answers DROP CONSTRAINT IF EXISTS quiz_attempt_answers_question_id_fkey;
ALTER TABLE quiz_attempt_answers ADD CONSTRAINT quiz_attempt_answers_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
ALTER TABLE quiz_attempt_answers DROP CONSTRAINT IF EXISTS quiz_attempt_answers_selected_option_id_fkey;
ALTER TABLE quiz_attempt_answers ADD CONSTRAINT quiz_attempt_answers_selected_option_id_fkey
  FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE CASCADE;
