// ============================================================================
// הגדרות העלאת קבצים (Upload Config)
// ----------------------------------------------------------------------------
// תפקיד הקובץ:
//   מגדיר את middleware ה-multer שמטפל בהעלאת קבצים מהלקוח לשרת
//   (תמונות, וידאו ומסמכים) ושומר אותם בדיסק בתיקיית uploads.
//
// מה יש כאן:
//   • upload — אובייקט ה-multer המיוצא, המשמש בנתיבים שמקבלים קבצים
//     (למשל בהעלאת תוכן/מדיה לפרקים).
//
// הקשר במערכת:
//   הקבצים נשמרים תחת backend/uploads עם שם ייחודי, ומוגשים חזרה כסטטיים
//   דרך הנתיב /uploads שמוגדר ב-server.ts. contentController שומר את הנתיב
//   שהתקבל במסד.
// ============================================================================

import multer from "multer";
import path from "path";
import fs from "fs";

// תיקיית ההעלאות
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // שם ייחודי: timestamp + מספר אקראי + סיומת מקורית
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

// סיומות מותרות: תמונות, וידאו, ומסמכים (PDF / Word / Excel / PowerPoint)
const allowedExt =
  /\.(jpe?g|png|gif|webp|mp4|webm|ogg|pdf|docx?|xlsx?|pptx?|csv|txt)$/i;

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // עד 100MB (לסרטונים)
  fileFilter: (_req, file, cb) => {
    // בודקים לפי סיומת בלבד — ה-mimetype של Word/Excel לא עקבי בין דפדפנים
    if (allowedExt.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("סוג קובץ לא נתמך. מותר: תמונות, וידאו, PDF, Word, Excel, PowerPoint"));
    }
  },
});
