// ============================================================================
// שכבת ביניים לאימות והרשאות (Auth Middleware)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מספק פונקציות middleware שרצות לפני ה-handlers של הנתיבים ומוודאות
//   את זהות המשתמש (JWT) ואת הרשאותיו.
//
// מה יש כאן:
//   • AuthRequest    — טיפוס Request מורחב שמכיל את פרטי המשתמש המאומת (req.user).
//   • authenticate   — מחייב token תקין; חוסם את הבקשה אם אין (401).
//   • optionalAuth   — מאכלס את req.user אם קיים token, אך לא חוסם אם אין.
//   • requireAdmin   — מוודא שהמשתמש בעל תפקיד ADMIN; אחרת מחזיר 403.
//
// הקשר במערכת:
//   ה-token נבנה ב-authController בעת התחברות ומאומת כאן מול JWT_SECRET.
//   הנתיבים (routes) משרשרים את הפונקציות האלה לפני הבקרים כדי לאבטח אותם.
// ============================================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// הרחבה של Request של Express: לאחר אימות מוצלח שדה user מכיל את מזהה המשתמש ותפקידו.
export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

// middleware: מחייב התחברות. בודק כותרת Authorization מסוג "Bearer <token>",
// מאמת את ה-JWT, ומאכלס req.user. אם אין token או שאינו תקין — מחזיר 401.
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

// middleware: מוודא שהמשתמש המאומת הוא מנהל (ADMIN). יש להריץ אחרי authenticate.
// אם התפקיד אינו ADMIN — חוסם עם 403.
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "אין הרשאה — נדרש מנהל" });
    return;
  }
  next();
}
