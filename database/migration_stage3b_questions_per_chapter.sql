-- ============================================================
-- Stage 3b migration: questions belong to a chapter.
-- Run in pgAdmin Query Tool against db rf_learning.
-- Safe to run more than once (idempotent).
-- ============================================================

-- Add chapter_id to questions (nullable so existing course-level
-- questions are not broken; new questions will set it).
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter_id BIGINT
  REFERENCES chapters(id) ON DELETE CASCADE;

-- Helpful index for fetching a chapter's questions.
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
