import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// תבנית שם משתמש: OA + 9 ספרות (תעודת זהות). לדוגמה OA123456789
const USERNAME_RE = /^OA\d{9}$/;

// כללי סיסמה: אות גדולה + אות קטנה + מספר, אורך 6–8 תווים.
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,8}$/;

function validateCredentials(username: string, password: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return 'שם המשתמש חייב להיות בתבנית OA ואחריו 9 ספרות (לדוגמה OA123456789)';
  }
  if (!PASSWORD_RE.test(password)) {
    return 'הסיסמה חייבת להכיל אות גדולה, אות קטנה ומספר, באורך 6 עד 8 תווים';
  }
  return null;
}

function generateTokens(userId: number, role: string) {
  const accessToken = jwt.sign({ userId, role }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

// פונקציית עזר ליצירת משתמש (תלמיד או מנהל) עם ולידציה מלאה.
// creatorId נשמר ב-created_by לצורך שרשרת ההרשאות.
async function createUser(opts: {
  full_name: string;
  username: string;
  password: string;
  role: "STUDENT" | "ADMIN";
  title?: string;
  specialization_id?: number | null;
  creatorId?: number | null;
  assigned_admin_id?: number | null;
}): Promise<{ ok: true; user: any } | { ok: false; status: number; error: string }> {
  const { full_name, username, password, role, title, specialization_id, creatorId, assigned_admin_id } = opts;

  if (!full_name || !username || !password) {
    return { ok: false, status: 400, error: "שם מלא, שם משתמש וסיסמה חובה" };
  }
  const vErr = validateCredentials(username, password);
  if (vErr) return { ok: false, status: 400, error: vErr };

  // כל מנהל (פרט ל-root, שנוצר ישירות ב-DB) חייב טייטל/תפקיד
  if (role === "ADMIN" && !title?.trim()) {
    return { ok: false, status: 400, error: "חובה להזין תפקיד (טייטל) למנהל" };
  }

  const national_id = username.slice(2); // 9 הספרות אחרי OA

  const existing = await pool.query(
    "SELECT id FROM users WHERE username = $1 OR national_id = $2",
    [username, national_id]
  );
  if (existing.rows.length > 0) {
    return { ok: false, status: 409, error: "משתמש עם שם משתמש או ת\"ז זו כבר קיים" };
  }

  const password_hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (full_name, national_id, username, password_hash, role, title, specialization_id, created_by, assigned_admin_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, full_name, national_id, username, role, title, specialization_id, assigned_admin_id`,
    [full_name, national_id, username, password_hash, role, role === "ADMIN" ? title!.trim() : null, specialization_id ?? null, creatorId ?? null, role === "STUDENT" ? (assigned_admin_id ?? null) : null]
  );
  return { ok: true, user: result.rows[0] };
}

// POST /api/auth/register — הרשמה עצמית של תלמיד בלבד (לא ניתן ליצור מנהל כאן)
export async function register(req: Request, res: Response) {
  const { full_name, username, password, specialization_id } = req.body;

  const result = await createUser({
    full_name,
    username,
    password,
    role: "STUDENT",
    specialization_id,
  });

  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  const user = result.user;
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  res.status(201).json({ user, accessToken, refreshToken });
}

// POST /api/admin/users — מנהל יוצר תלמיד או מנהל (שרשרת הרשאות).
// יצירת מנהל מותרת רק למנהל מחובר. נשמר created_by.
export async function adminCreateUser(req: AuthRequest, res: Response) {
  const { full_name, username, password, role, title, specialization_id, assigned_admin_id } = req.body;
  const requestedRole = role === "ADMIN" ? "ADMIN" : "STUDENT";
  const creatorId = req.user!.userId;

  // שיוך התלמיד למנהל: מנהל כללי בוחר מהטופס; מנהל רגיל — התלמיד משויך אליו עצמו
  let assignedAdmin: number | null = null;
  if (requestedRole === "STUDENT") {
    const creatorSuper = await pool.query(
      "SELECT is_super_admin FROM users WHERE id = $1",
      [creatorId]
    );
    const isSuper = creatorSuper.rows[0]?.is_super_admin === true;
    assignedAdmin = isSuper ? (assigned_admin_id ? Number(assigned_admin_id) : null) : creatorId;
  }

  const result = await createUser({
    full_name,
    username,
    password,
    role: requestedRole,
    title,
    specialization_id,
    creatorId,
    assigned_admin_id: assignedAdmin,
  });

  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(201).json({ user: result.user, message: requestedRole === "ADMIN" ? "מנהל נוצר בהצלחה" : "תלמיד נוצר בהצלחה" });
}

// כניסה עם שם משתמש (OA+ת"ז) + סיסמה
export async function login(req: Request, res: Response) {
  // תומך גם בשדה username וגם בשדה national_id (תאימות לאחור — מומר ל-OA+ת"ז)
  const rawUsername = req.body.username || (req.body.national_id ? `OA${req.body.national_id}` : "");
  const { password } = req.body;

  if (!rawUsername || !password) {
    res.status(400).json({ error: "שם משתמש וסיסמה חובה" });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT id, full_name, national_id, username, role, is_super_admin, password_hash FROM users WHERE username = $1",
      [rawUsername]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "שם משתמש או סיסמה שגויים" });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: "שם משתמש או סיסמה שגויים" });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.json({
      user: { id: user.id, full_name: user.full_name, national_id: user.national_id, username: user.username, role: user.role, is_super_admin: user.is_super_admin },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token חסר" });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: number };

    const result = await pool.query("SELECT id, role FROM users WHERE id = $1", [payload.userId]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: "משתמש לא נמצא" });
      return;
    }

    const user = result.rows[0];
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: "Refresh token לא תקין או פג תוקף" });
  }
}

export function logout(_req: Request, res: Response) {
  res.json({ message: "התנתקת בהצלחה" });
}
