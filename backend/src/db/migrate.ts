// ============================================================================
// מנוע המיגרציות (Migration Runner)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מריץ אוטומטית את קבצי ה-SQL שבתיקיית database/ כדי ליצור/לעדכן את סכמת
//   מסד הנתונים, תוך מעקב אחר אילו קבצים כבר הורצו (טבלת schema_migrations).
//
// מה יש כאן:
//   • runMigrations — הפונקציה המיוצאת. מריצה כל מיגרציה חדשה לפי סדר אלפביתי.
//
// מנגנון baseline:
//   אם טבלת המעקב ריקה אך הסכמה כבר קיימת (טבלת users נמצאת) — כל הקבצים
//   הקיימים מסומנים כ"מורצו" בלי להריץ בפועל, כדי למנוע כפילות מול סכמה
//   שהוקמה ידנית. משם והלאה מורצים רק קבצים חדשים.
//
// הקשר במערכת:
//   נקרא ב-server.ts לפני עליית השרת, וגם ידנית דרך migrateCli.ts (npm run migrate).
//   ניגש למסד דרך pool ולתיקיית database/ שבשורש הפרויקט.
// ============================================================================

import fs from "fs";
import path from "path";
import { pool } from "../config/db";

// תיקיית קבצי ה-SQL (database/ בשורש הפרויקט, שתי רמות מעל src/db)
const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "..", "database");

// קבצים שאסור להריץ אוטומטית: RUN_ME הוא קונסולידציה כפולה של stage3 (כבר מכוסה
// ע"י הקבצים הבודדים) — מדלגים עליו כדי לא להריץ פעמיים.
const SKIP_FILES = new Set(["RUN_ME_pending_migrations.sql"]);

/**
 * מריץ אוטומטית כל מיגרציה ב-database/*.sql שטרם הורצה, לפי סדר אלפביתי.
 * מנגנון baseline: אם הטבלה users כבר קיימת אך טבלת המעקב ריקה, מסמנים את
 * כל הקבצים הקיימים כ"מורצו" בלי להריץ (כי הם כבר הורצו ידנית בעבר) —
 * ומריצים בפועל רק קבצים שייווספו מכאן והלאה. כך אין כפילות ואין drift.
 */
export async function runMigrations(): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename   VARCHAR(255) PRIMARY KEY,
       applied_at TIMESTAMP NOT NULL DEFAULT now()
     )`
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql") && !SKIP_FILES.has(f))
    .sort(); // schema.sql < migration_fix... < migration_stage3... — סדר אלפביתי תקין

  const appliedRes = await pool.query("SELECT filename FROM schema_migrations");
  const applied = new Set<string>(appliedRes.rows.map((r) => r.filename));

  // baseline: טבלת המעקב ריקה אך הסכמה כבר קיימת -> סמן הכל כמורץ בלי להריץ
  if (applied.size === 0) {
    const usersExists = await pool.query(
      `SELECT to_regclass('public.users') AS t`
    );
    if (usersExists.rows[0].t) {
      for (const f of files) {
        await pool.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
          [f]
        );
        applied.add(f);
      }
      console.log(
        `[migrate] baseline: ${files.length} מיגרציות קיימות סומנו כמורצו (סכמה כבר קיימת)`
      );
    }
  }

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log("[migrate] אין מיגרציות חדשות להרצה");
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    console.log(`[migrate] מריץ ${file} ...`);
    // ללא טרנזקציה עוטפת: קבצי enum מסתמכים על autocommit לכל statement
    await pool.query(sql);
    await pool.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
      [file]
    );
    console.log(`[migrate] ✓ ${file}`);
  }
  console.log(`[migrate] הושלמו ${pending.length} מיגרציות`);
}
