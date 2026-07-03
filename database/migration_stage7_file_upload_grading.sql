-- ============================================================
-- Stage 7 migration: FILE_UPLOAD questions + grading system
-- Allows students to upload files as answers
-- Admins can grade free-text & file-upload answers
-- Student-Admin relationship for grading oversight
-- ============================================================

-- 1) Add FILE_UPLOAD to question_type enum
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'FILE_UPLOAD';

-- 2) Add grading_status to quiz_attempt_answers (was just needs_grading boolean)
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS grading_status VARCHAR(20) NOT NULL DEFAULT 'AUTO_GRADED';
-- Values: 'AUTO_GRADED' (multiple-choice), 'AWAITING_REVIEW' (free-text/file), 'GRADED' (manually reviewed)

-- 3) Add admin notes/comments when grading
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS admin_comments TEXT;

-- 4) Track who graded the answer
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS graded_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP;

-- 5) Store file upload paths for file-upload questions
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 6) Add assigned_admin to users table (each student gets an admin for oversight)
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- 7) Create grading queue table for admin to see pending items
CREATE TABLE IF NOT EXISTS grading_queue (
  id BIGSERIAL PRIMARY KEY,
  attempt_id BIGINT NOT NULL REFERENCES quiz_attempts_course(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id),
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_type question_type NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- status: PENDING, IN_PROGRESS, GRADED
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  UNIQUE(attempt_id, question_id)
);

-- 8) Create grading history table
CREATE TABLE IF NOT EXISTS grading_history (
  id BIGSERIAL PRIMARY KEY,
  attempt_id BIGINT NOT NULL REFERENCES quiz_attempts_course(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id),
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_score DECIMAL(5,2),
  new_score DECIMAL(5,2),
  admin_comments TEXT,
  graded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9) Update quiz_attempts_course status values
-- ALTER TYPE is complex; we handle this in code by checking status column
-- (was 'GRADED' | 'PENDING_REVIEW', now also supports 'PARTIALLY_GRADED')

-- 10) Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_grading_queue_admin_status ON grading_queue(admin_id, status);
CREATE INDEX IF NOT EXISTS idx_grading_queue_student ON grading_queue(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_grading ON quiz_attempt_answers(grading_status, needs_grading);
CREATE INDEX IF NOT EXISTS idx_users_assigned_admin ON users(assigned_admin_id);
