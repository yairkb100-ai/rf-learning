# הפעלה מהירה — לומדת ענף 71

## שלב 1: הפעלת Backend
```bash
cd "c:\Users\yairk\OneDrive\שולחן העבודה\rf-learning-system\backend"
npm run dev
```
**יצא:** `Server running on port 3000`

---

## שלב 2: הפעלת Frontend
חלון CMD/Terminal נוסף:
```bash
cd "c:\Users\yairk\OneDrive\שולחן העבודה\rf-learning-system\frontend"
npm run dev
```
**יצא:** `http://localhost:5173`

---

## שלב 3: פתח בכרום
```
http://localhost:5173
```

---

## התחברות בדיקה

### כמנהל
- **ת"ז:** `999999999`
- **סיסמה:** `postgres123`
- **גישה:** לדף ניהול (`/admin`)

### כתלמיד
- **ת"ז:** `123456789`
- **סיסמה:** `password123`
- **גישה:** דף בית עם קורסים

---

## בדיקת קורסי מנועים

### אם קורסים לא קיימים
```bash
cd "c:\Users\yairk\OneDrive\שולחן העבודה\rf-learning-system\backend"
node create_engine_courses.js
```

### אם רוצה לבדוק ב-SQL
```sql
-- כנס ל-pgAdmin כ-postgres / postgres123
-- בחר DB: rf_learning
-- כתוב בQuery Tool:

SELECT id, title FROM courses;
SELECT COUNT(*) FROM chapters WHERE course_id IN (8, 9);
```

---

## קבצים חשובים

| קובץ | מטרה |
|------|------|
| `SESSION_SUMMARY.md` | סיכום מלא של הסשן |
| `backend/create_engine_courses.js` | יצירת קורסים + פרקים ✅ |
| `backend/create_engine_content.js` | יצירת תוכן (צריך תיקון) |
| `src/components/RichTextEditor.tsx` | עורך טקסט עשיר |
| `src/App.css` | סגנון Udemy מלא |

---

## בעיות נפוצות

### ❌ "Cannot find module postgres"
```bash
cd backend
npm install
npm run dev
```

### ❌ "Port 3000 already in use"
```bash
taskkill /F /IM node.exe
# ואז הרץ שוב npm run dev
```

### ❌ "Cannot connect to database"
- בדוק שפוסטגרס רץ (Services בחלונות או pgAdmin)
- בדוק credentials: host=localhost, port=5432, database=rf_learning, user=postgres, password=postgres123

### ❌ "FreshDB — אין טבלאות"
```bash
# בדוק ב-pgAdmin שDB rf_learning קיים ויש טבלאות
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```

---

## סטיס האפליקציה

✅ **עיצוב Udemy** — בהיר (יום/לילה)  
✅ **עורך RTF** — טקסט עשיר עם סרגל כלים  
✅ **קורסים** — 7 קורסים (תקשורת + מנועים)  
✅ **ניווט** — סרגל עליון + Sidebar + כפתור Logo  
✅ **תמיכת קבצים** — Word, Excel, PDF, וקטנועים  

⚠️ **תוכן מנועים** — בתהליך (צריך יותר טקסט עברי + תמונות)  
⚠️ **ארכיטקטורה מגמות** — תלוי בסשן הבא

---

**סוף המדריך.**
