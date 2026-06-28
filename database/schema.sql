-- RF Learning System - Database Schema

CREATE DATABASE rf_learning;
\c rf_learning;

-- ENUMs
CREATE TYPE user_role AS ENUM ('ADMIN', 'INSTRUCTOR', 'STUDENT');
CREATE TYPE user_theme AS ENUM ('LIGHT', 'DARK');
CREATE TYPE content_type AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'PDF', 'LINK');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE');
CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED');

-- טבלה 1: Users
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  national_id   VARCHAR(20)  NOT NULL UNIQUE,
  email         VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'STUDENT',
  theme         user_theme   NOT NULL DEFAULT 'LIGHT',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- טבלה 2: Courses
CREATE TABLE courses (
  id          BIGSERIAL    PRIMARY KEY,
  title       VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- טבלה 3: Chapters
CREATE TABLE chapters (
  id           BIGSERIAL    PRIMARY KEY,
  course_id    BIGINT       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  order_number INTEGER      NOT NULL DEFAULT 1,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE
);

-- טבלה 4: Learning_Content
-- חומר לימוד שיכול להיות משויך לקורס (מבוא) או לפרק
CREATE TABLE learning_content (
  id           BIGSERIAL    PRIMARY KEY,
  course_id    BIGINT       REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id   BIGINT       REFERENCES chapters(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  title        VARCHAR(200) NOT NULL,
  content      TEXT         NOT NULL,  -- טקסט, או נתיב לקובץ שהועלה, או URL
  sort_order   INTEGER      NOT NULL DEFAULT 1,
  CHECK (course_id IS NOT NULL OR chapter_id IS NOT NULL)
);

-- טבלה 5: Questions
CREATE TABLE questions (
  id            BIGSERIAL     PRIMARY KEY,
  course_id     BIGINT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question_type question_type NOT NULL DEFAULT 'MULTIPLE_CHOICE',
  question_text TEXT          NOT NULL,
  explanation   TEXT,
  hint          TEXT
);

-- טבלה 6: Question_Options
CREATE TABLE question_options (
  id          BIGSERIAL PRIMARY KEY,
  question_id BIGINT    NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT      NOT NULL,
  is_correct  BOOLEAN   NOT NULL DEFAULT FALSE
);

-- טבלה 7: Quiz_Attempts_Course
CREATE TABLE quiz_attempts_course (
  id           BIGSERIAL      PRIMARY KEY,
  user_id      BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    BIGINT         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score        DECIMAL(5,2)   NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- טבלה 8: Quiz_Attempt_Answers
CREATE TABLE quiz_attempt_answers (
  id                 BIGSERIAL PRIMARY KEY,
  attempt_id         BIGINT    NOT NULL REFERENCES quiz_attempts_course(id) ON DELETE CASCADE,
  question_id        BIGINT    NOT NULL REFERENCES questions(id),
  selected_option_id BIGINT    NOT NULL REFERENCES question_options(id),
  is_correct         BOOLEAN   NOT NULL DEFAULT FALSE
);

-- טבלה 9: User_Progress
CREATE TABLE user_progress (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id       BIGINT    NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  progress_percent INTEGER   NOT NULL DEFAULT 0,
  is_completed     BOOLEAN   NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMP,
  UNIQUE(user_id, chapter_id)
);

-- טבלה 10: Recommendations_Analytics (future)
CREATE TABLE recommendations_analytics (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strong_topics   TEXT,
  weak_topics     TEXT,
  recommendations TEXT,
  generated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- טבלה 11: Admin_Audit_Log
CREATE TABLE admin_audit_log (
  id          BIGSERIAL    PRIMARY KEY,
  admin_id    BIGINT       NOT NULL REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   BIGINT       NOT NULL,
  description TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- טבלה 12: Course_Enrollments
CREATE TABLE course_enrollments (
  id          BIGSERIAL         PRIMARY KEY,
  user_id     BIGINT            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   BIGINT            NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status      enrollment_status NOT NULL DEFAULT 'ACTIVE',
  UNIQUE(user_id, course_id)
);
