-- ============================================================
-- Stage 4 migration: מגמות (specializations)
-- היררכיה: מגמות → קורסים → פרקים. קורס יכול להיות:
--   - משויך למגמה אחת (specialization_id)
--   - כללי / משותף לכולם (specialization_id IS NULL)
-- תלמיד משויך למגמה אחת (users.specialization_id), ורואה את קורסי
-- המגמה שלו + כל הקורסים הכלליים.
-- בטוח להריץ יותר מפעם אחת (idempotent).
-- ============================================================

-- 1) טבלת המגמות
CREATE TABLE IF NOT EXISTS specializations (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2) שיוך קורס למגמה (NULL = קורס כללי לכולם)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS specialization_id BIGINT
  REFERENCES specializations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_courses_specialization ON courses(specialization_id);

-- 3) שיוך תלמיד למגמה (NULL = ללא מגמה; יראה רק קורסים כלליים)
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization_id BIGINT
  REFERENCES specializations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_specialization ON users(specialization_id);
