import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "נדרשת התחברות" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token לא תקין או פג תוקף" });
  }
}

// אימות אופציונלי: אם קיים token תקין — מאכלס req.user; אחרת ממשיך בלי לחסום.
// משמש למסכים ציבוריים שמתאימים את התוצאה למשתמש המחובר (למשל סינון קורסים לפי מגמה).
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_SECRET!
      ) as { userId: number; role: string };
      req.user = payload;
    } catch {
      // token לא תקין — מתעלמים וממשיכים כאנונימי
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "אין הרשאה — נדרש מנהל" });
    return;
  }
  next();
}
