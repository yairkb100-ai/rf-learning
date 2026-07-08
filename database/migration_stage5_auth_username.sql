-- ============================================================
-- Stage 5: שם משתמש בתבנית OA+ת"ז + שרשרת הרשאות מנהלים
-- בטוח להריץ יותר מפעם אחת (idempotent).
-- ============================================================

-- 1) שם משתמש ייחודי (OA + 9 ספרות), למשל OA123456789
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(20);

-- מילוי ערכי username למשתמשים קיימים מתוך תעודת הזהות (אם עדיין ריק)
UPDATE users SET username = 'OA' || national_id WHERE username IS NULL;

-- ייחודיות + אינדקס
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2) מי יצר את המשתמש (שרשרת הוספת מנהלים). NULL = ה-root / משתמש קיים.
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by BIGINT
  REFERENCES users(id) ON DELETE SET NULL;

-- 3) טייטל/תפקיד למנהל (חובה לכל מנהל פרט ל-root)
ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(120);
