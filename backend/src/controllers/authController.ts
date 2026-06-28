import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

function generateTokens(userId: number, role: string) {
  const accessToken = jwt.sign({ userId, role }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

// רק Admin יוצר משתמשים — POST /api/auth/register
export async function register(req: Request, res: Response) {
  const { full_name, national_id, password, role } = req.body;

  if (!full_name || !national_id || !password) {
    res.status(400).json({ error: "שם מלא, תעודת זהות וסיסמה חובה" });
    return;
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE national_id = $1",
      [national_id]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({ error: "משתמש עם תעודת זהות זו כבר קיים" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userRole = role === "ADMIN" ? "ADMIN" : "STUDENT";

    const result = await pool.query(
      `INSERT INTO users (full_name, national_id, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, national_id, role`,
      [full_name, national_id, password_hash, userRole]
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.status(201).json({
      user: { id: user.id, full_name: user.full_name, national_id: user.national_id, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

// כניסה עם תעודת זהות + סיסמה
export async function login(req: Request, res: Response) {
  const { national_id, password } = req.body;

  if (!national_id || !password) {
    res.status(400).json({ error: "תעודת זהות וסיסמה חובה" });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT id, full_name, national_id, role, password_hash FROM users WHERE national_id = $1",
      [national_id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "תעודת זהות או סיסמה שגויים" });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: "תעודת זהות או סיסמה שגויים" });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.json({
      user: { id: user.id, full_name: user.full_name, national_id: user.national_id, role: user.role },
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
