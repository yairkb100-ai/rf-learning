-- ============================================================
-- Stage 3c migration: rich content (text + image together)
-- + ability to store a second value per content item.
-- Run in pgAdmin Query Tool against db rf_learning.
-- Safe to run more than once (idempotent).
-- ============================================================

-- 1) New content type RICH (text + image in one item).
-- IMPORTANT: in pgAdmin, run THIS line on its own first (Execute),
-- then run the rest. A new enum value can't be used in the same
-- transaction it was added in.
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'RICH';

-- 2) Second value column. For RICH this holds the image path
--    (/uploads/...). 'content' holds the text. NULL for other types.
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS extra TEXT;
