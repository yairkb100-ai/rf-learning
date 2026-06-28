-- ============================================================
-- Stage 3 migration: question types (multiple-select + free-text)
-- + video in questions + manual grading flow.
-- Run in pgAdmin Query Tool against db rf_learning.
-- Safe to run more than once (idempotent).
-- ============================================================

-- 1) Extend question_type enum
-- IMPORTANT: in pgAdmin, select and run JUST these two lines first (Execute),
-- then select and run the rest of the file. PostgreSQL does not allow using a
-- newly added enum value in the same transaction it was added in.
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'MULTIPLE_SELECT';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'FREE_TEXT';

-- 2) Video embedded in a question (YouTube or uploaded file URL)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3) quiz_attempt_answers: support free-text + multi-select + manual grading
--    selected_option_id must allow NULL (free-text has no option)
ALTER TABLE quiz_attempt_answers ALTER COLUMN selected_option_id DROP NOT NULL;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS free_text_answer TEXT;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS points_awarded DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS max_points DECIMAL(5,2) NOT NULL DEFAULT 1;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS needs_grading BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS question_type question_type NOT NULL DEFAULT 'MULTIPLE_CHOICE';

-- 4) quiz_attempts_course: status to mark exams awaiting manual review
--    GRADED = final score; PENDING_REVIEW = has free-text awaiting admin grading
ALTER TABLE quiz_attempts_course ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'GRADED';

-- 5) Store the model answer for free-text questions (shown to admin while grading)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS model_answer TEXT;
