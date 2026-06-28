-- ============================================================
-- Fix: deleting a course/question failed because
-- quiz_attempt_answers had FKs with ON DELETE NO ACTION,
-- which blocked the cascade. Recreate them with ON DELETE CASCADE.
-- Run in pgAdmin Query Tool against db rf_learning.
-- Safe to run more than once.
-- ============================================================

-- 1) quiz_attempt_answers.question_id -> questions(id)
ALTER TABLE quiz_attempt_answers
  DROP CONSTRAINT IF EXISTS quiz_attempt_answers_question_id_fkey;
ALTER TABLE quiz_attempt_answers
  ADD CONSTRAINT quiz_attempt_answers_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

-- 2) quiz_attempt_answers.selected_option_id -> question_options(id)
--    (already nullable; cascade so deleting a question/option cleans answers)
ALTER TABLE quiz_attempt_answers
  DROP CONSTRAINT IF EXISTS quiz_attempt_answers_selected_option_id_fkey;
ALTER TABLE quiz_attempt_answers
  ADD CONSTRAINT quiz_attempt_answers_selected_option_id_fkey
  FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE CASCADE;
