# סיכום סשן — לומדת ענף 71

**תאריך:** 2026-06-27  
**סטטוס:** סיום עבודה על עיצוב ממשק Udemy + הוספת תוכן מנועים (בתהליך)

---

## ✅ מה שהשלמנו בסשן זה

### 1. **עיצוב Udemy מלא** (Light Mode)
- **צבעים:** רקע לבן, טקסט כהה, אקסנט סגול (#a435f0)
- **פונטים:** Heebo clean sans-serif (הסרת mono techno)
- **ה-Glow/Neon effects:** הוסרו לגמרי
- **עמודים שעודכנו:**
  - דף הקורס (CoursePage) — hero כהה, שתי עמודות, כרטיס התקדמות דביק
  - דף הפרק (ChapterPage) — layout נקי
  - כל הדפים — קוי חזקים, צבעים מוגדרים

### 2. **עורך טקסט עשיר (WYSIWYG)**
- **סרגל כלים מלא:** B (מודגש), I (נטוי), U (קו תחתון), הדגלה, גדלים, יישור, רשימות, בורר צבע
- **קומפוננטה:** `RichTextEditor.tsx` — משתמשת `contentEditable` בלי ספריות חיצוניות
- **יישום:** חומר לימוד (TEXT/RICH), תיאור פרקים
- **עיבוד:** התמרה בטוחה של HTML (sanitizeHtml) בתצוגה

### 3. **הרחבת סוגי קבצים**
- **Backend:** `upload.ts` — תמיכה ב-.doc/.docx/.xls/.xlsx/.ppt/.pptx/.csv/.txt
- **Frontend:** AdminContentPage — סוג "מסמך" כללי, אייקונים לפי סוג (📝 Word, 📊 Excel, 📽️ PPT)

### 4. **נגישות וניווט**
- **לוגו קליק:** "לומדת ענף 71" בכותרת → חזרה לדף בית מכל מקום
- **כפתור הוספת חומר:** בדף קורס (למנהל) — ניווט ישיר לניהול תוכן

### 5. **מערכת יום/לילה**
- **Theme Picker:** הוסר (פלטות צבעים לא פעילות)
- **Theme Toggle:** 🌙/☀️ — החלפה בין יום (בהיר) ללילה (כהה)
- **Palettes:** שתיים בלבד — light ו-dark (כל השאר נמחקו)

### 6. **קורסי מנועים** (בתהליך)
- **יצירת קורסים:** 
  - ID 8: "מנועי בוכנה" (5 פרקים)
  - ID 9: "מנועי סילון" (5 פרקים)
- **סקריפט יצירה:** `create_engine_courses.js` (הרץ בהצלחה)
- **סקריפט תוכן:** `create_engine_content.js` (טעון — צריך דוגמא)

---

## ✅ עדכון סשן 2026-06-27 (המשך) — קורסי המנועים נפתרו

### קורסי המנועים — תוכן נכנס בהצלחה
- **התברר:** הקורסים (8,9), הפרקים (12–21) והתוכן **כולם קיימים ב-DB** (טבלת `learning_content`, לא `content`).
- **הבעיה האמיתית:** חלק מהתוכן נכנס פעמיים (כפילויות בפרקים 12, 13, 17) — מהרצה כפולה של סקריפט.
- **בוצע:** מחיקת 5 רשומות כפולות (השארנו את הגרסאות הארוכות/עשירות).
- **בוצע:** הוספת סעיף עיוני מעמיק בעברית לכל 10 פרקי המנועים (sort_order=10, ~800–1100 תווים עם יתרונות/חסרונות ונתונים טכניים).
- **סקריפט:** `backend/add_deep_content.js` — אידמפוטנטי (UPSERT לפי chapter_id+title), ניתן להרצה חוזרת לעריכת התוכן.

## ✅ עדכון 2026-06-28 — בדיקת QA, חלקי מנוע ושאלות

### בעיה קריטית שהתגלתה ותוקנה: מיגרציות לא רצו
- טבלת `questions` חסרה עמודות (`chapter_id`, `video_url`, `model_answer`) ו-enum `question_type` חסר `MULTIPLE_SELECT`/`FREE_TEXT`.
- **משמעות:** כל פיצ'ר השאלות/מבחנים היה **שבור** (כל יצירה/שליפה של שאלות לפרק נכשלה ב-SQL).
- **בוצע:** הרצת כל המיגרציות התלויות (`database/RUN_ME_pending_migrations.sql`) בסדר הנכון. הפיצ'ר עובד כעת.

### פרק חדש: "חלקי המנוע ותפקידם" (קורס 8, פרק 6, chapter_id=22)
תוכן טכני מעמיק על: צילינדר, בוכנה, טלטל, גל ארכובה, גל זיזים, שסתומים, גלגל תנופה, מצת, סליל הצתה, קרבורטור, מזרק/אינג'קטור, מסנן אוויר, טורבו, סופרצ'רג'ר, מצנן ביניים, משאבת+מסנן שמן, מסנן דלק, רדיאטור+משאבת מים, מצבר, אלטרנטור, מתנע — כולל הסבר על המרת תנועה קווית לסיבובית. שרטוט חתך: `/uploads/eng_parts.svg`.

### שאלות (20 חדשות, 3 סוגים)
- אמריקאיות (12), רב-ברירה (4), פתוחות (4). דגש על פרק חלקי המנוע (9 שאלות).
- כל השאלות עברו QA: MC עם תשובה נכונה אחת בדיוק, MS עם ≥1 נכונה, FREE_TEXT עם model_answer.
- `ExamPage.tsx` תומך בכל 3 הסוגים.

### תמונות — תוקנו (קישורי Wikipedia השבורים הוחלפו ב-SVG מקומיים)
שרטוטי SVG בעברית ב-`backend/uploads`, מוגשים מהשרת. 0 קישורים חיצוניים שבורים.

**סקריפטים (אידמפוטנטיים, ב-backend/):** `add_engine_parts.js`, `add_engine_questions.js`, `gen_engine_diagrams.js`, `add_deep_content.js`, `rewrite_intro_content.js`, `tidy_engine_images.js`.

## ✅ עדכון 2026-06-28 — ארכיטקטורת מגמות (Specializations)

- טבלת `specializations`; `courses.specialization_id` (NULL=כללי); `users.specialization_id`.
- מיגרציה: `database/migration_stage4_specializations.sql`.
- Backend: `specializationsController` + routes; `optionalAuth` middleware; `getAllCourses` מסונן לפי המגמה של המשתמש (תלמיד רואה מגמה שלו + כלליים; מנהל רואה הכל). פילטרים `?specialization_id` / `?general=1`.
- Frontend: HomePage מציג מגמות + קורסים כלליים; `SpecializationPage` חדש; AdminPage — בחירת/שינוי מגמה לקורס.
- אבטחה אומתה: תלמיד ממגמה אחרת לא רואה ולא יכול לגשת לקורסי מגמה אחרת (גם עם פרמטר מפורש).
- תלמיד דמו 123456789 שויך למגמת מנועים; נוצר 111111111 למגמת תקשורת לבדיקה.

## ✅ עדכון 2026-06-28 — קורס ארכיטקטורה + העברה/שכפול

### קורס חדש "ארכיטקטורת מחשבים" (course 10, מגמת מחשוב ובקרה / spec 3)
4 פרקים, 8 פריטי תוכן טכני: מודל פון-נוימן, מחזור הוראה, RAM (DRAM/SRAM/DDR), היררכיית זיכרון ומטמון, אפיקים (Address/Data/Control), קלט/פלט ופסיקות (DMA), מקביליות (ILP/TLP/DLP, ריבוי ליבות, חוק אמדל), צנרת וזיכרון וירטואלי. 7 שרטוטי SVG (`/uploads/arch_*.svg`). סקריפטים: `add_architecture_course.js`, `gen_arch_diagrams.js`.

### העברה ושכפול (מנהל) — backend חדש
- `adminOpsController` + routes תחת `/api/admin` (מנהל בלבד):
  - `POST /admin/courses/:id/duplicate` — עותק מלא של קורס (פרקים+תוכן+שאלות+אפשרויות), עם מגמת יעד.
  - `PUT /admin/chapters/:id/move` — העברת פרק לקורס אחר.
  - `POST /admin/chapters/:id/duplicate` — שכפול פרק (לאותו קורס או אחר).
- UI: AdminPage — כפתור "שכפל" לקורס; AdminChaptersPage — "העבר לקורס" + "שכפל" לכל פרק.
- אומת end-to-end (deep-copy מלא) ונוקה.

## ✅ עדכון 2026-06-28 — ניהול מגמות מלא (UI) + שכפול מגמה

- **UI ניהול מגמות** ב-AdminPage: יצירה, שכפול ומחיקה של מגמות (סקשן "ניהול מגמות").
- **Backend חדש:** `POST /admin/specializations/:id/duplicate` — משכפל מגמה כולל כל הקורסים שלה (deep-copy מלא). רפקטור: `copyCourse` helper משותף.
- מחיקת מגמה: הקורסים שלה הופכים לכלליים (ON DELETE SET NULL), לא נמחקים.
- העברה/שכפול פרקים: כבר קיים ב-AdminChaptersPage ("העבר לקורס"/"שכפל").
- אומת end-to-end (יצירה/שכפול 2 קורסים/מחיקה-עם-יתום) ונוקה.

## ✅ עדכון 2026-06-28 — אימות, תפקידי מנהל ומעקב תלמידים

- **שם משתמש בתבנית `OA`+ת"ז** (למשל OA123456789). התחברות לפי username. מיגרציה: `database/migration_stage5_auth_username.sql` (username ייחודי, created_by, title).
- **סיסמה:** אות גדולה+קטנה+מספר, 6–8 תווים (regex בשרת ובקליינט).
- **מנהל root חדש:** `OA000000000` / `Admin123` (פטור מטייטל).
- **שרשרת הרשאות:** מנהל יוצר תלמידים ומנהלים; `created_by` נשמר. כל מנהל (פרט ל-root) חייב **טייטל/תפקיד**.
- **אין כפילויות** OA (unique על username + national_id).
- **מעקב תלמידים:** עמוד `/admin/users` (יצירה/רשימה) + `/admin/students/:id` (פירוט פרקים+מבחנים). API: `/admin/users`, `/admin/students/progress`, `/admin/students/:id/progress`.
- LoginPage עודכן ל-username. הרשמה עצמית מושבתת (רק מנהל יוצר משתמשים).

## ⚠️ מה שעדיין תלוי / בעיות

### 2. **ארכיטקטורה מגמות** (דרוש לסשן הבא)
- **בקשה:** שינוי היררכיה: מגמות → קורסים → פרקים
- **דף בית:** תצוגת מגמות (לא קורסים)
- **קורסי רוחב:** בחוץ מהמגמות
- **דאטה בייס:** צריך טבלת `specializations` חדשה + מיגרציה

### 3. **תוכן עיוני עמוק** (לסשן הבא)
- **נדרש:** טקסט מפורט בעברית בלבד עם:
  - יתרונות / חסרונות כל סוג מנוע
  - חוזק, מורכבות, עמידות
  - פרטים טכניים (RPM, הספק וכו')
  - שרטוטים וסכמות (QR/links לתמונות בעברית)
  - קבצים טכניים (PDF/Word בעברית)

---

## 🔧 איך להתחיל בסשן הבא

### 1. **הפעלת השרת**
```bash
# Terminal 1 — Backend (Node)
cd "c:\Users\yairk\OneDrive\שולחן העבודה\rf-learning-system\backend"
npm run dev

# Terminal 2 — Frontend (Vite)
cd "c:\Users\yairk\OneDrive\שולחן העבודה\rf-learning-system\frontend"
npm run dev
```

### 2. **כתובת בדיקה**
```
http://localhost:5173
```

### 3. **נתונים ברירת מחדל**
- **מנהל:** ת"ז `999999999`, סיסמה `postgres123`
- **תלמיד:** ת"ז `123456789`

### 4. **אם קורסי מנועים בודקים**
```bash
# בדוק אם הקורסים קיימים (מה"ח)
SELECT id, title FROM courses WHERE id IN (8, 9);

# אם לא — הרץ שוב את הסקריפט
cd "c:\Users\yairk\OneDrive\שולחן העבודה\rf-learning-system\backend"
node create_engine_courses.js
```

---

## 📋 קבצים שנוצרו / שונו

### Backend
- `src/config/upload.ts` — הרחבת סוגי קבצים
- `create_engine_courses.js` — יצירת קורסים + פרקים ✅
- `create_engine_content.js` — יצירת תוכן (צריך תיקון)

### Frontend
- `src/components/RichTextEditor.tsx` — עורך טקסט חדש
- `src/components/ContentViewer.tsx` — עדכון ל-HTML rendering + export sanitize/looksLikeHtml
- `src/components/Navbar.tsx` — לוגו קליק
- `src/context/ThemeContext.tsx` — פחתנו ל-light/dark בלבד
- `src/pages/AdminChaptersPage.tsx` — שילוב RichTextEditor בתיאור
- `src/pages/AdminContentPage.tsx` — סוגי קבצים חדשים + editor
- `src/pages/CoursePage.tsx` — layout Udemy, כפתור חומר למנהל
- `src/pages/ChapterPage.tsx` — HTML rendering בתיאור
- `src/App.css` — סגנון Udemy מלא (צבעים, פונטים, כלי עריכה, גיבור)
- `src/App.tsx` — נתיבים לא שונו

### Session Files
- `SESSION_SUMMARY.md` (קובץ זה) — סיכום מלא

---

## 🎯 משימות עבור הסשן הבא

### Priority 1: תיקון קורסי מנועים
- [ ] התאם את chapter IDs בסקריפט `create_engine_content.js`
- [ ] בדוק שהתוכן נכנס ל-DB בהצלחה
- [ ] אמת בדפדפן שהתמונות נטענות

### Priority 2: ארכיטקטורה מגמות
- [ ] יצור טבלת `specializations` ב-DB
- [ ] הוסף FK `specialization_id` בטבלת `courses`
- [ ] עדכן backend routes לטיפול במגמות
- [ ] שנה את HomePage להציג מגמות (לא קורסים)
- [ ] שנה את ה-Sidebar

### Priority 3: תוכן עיוני
- [ ] כתוב טקסט עיוני מפורט בעברית לכל פרק (מנועים בוכנה + סילון)
- [ ] הוסף שרטוטים / סכמות (כ-URL מתמונה אוקטוברית או הורדה)
- [ ] הוסף קבצי PDF / Word בעברית
- [ ] הוסף שאלות לכל פרק

### Priority 4: שאלות למנועים
- [ ] צור שאלות אמריקאיות (single choice)
- [ ] צור שאלות בחירה מרובה (multiple choice עם ניקוד חלקי)
- [ ] צור שאלות פתוחות (free text עם בדיקה ידנית)

---

## 💾 סטטוס DB

```sql
-- קורסים קיימים
SELECT COUNT(*) FROM courses; -- צריך להיות 9 (תקשורת + 2 מנועים)

-- פרקים קיימים
SELECT COUNT(*) FROM chapters; -- צריך להיות 15+ (עבור כל הקורסים)

-- בדוק מנועים ספציפיים
SELECT id, title FROM courses WHERE title LIKE '%מנוע%';
```

---

## 🎨 סטיל Udemy שנוצר

### צבעים (Light Mode)
```css
--bg: #ffffff
--text: #1c1d1f (כהה)
--primary: #a435f0 (סגול)
--border: #d1d7dc
--success: #1e8e3e (ירוק)
```

### צבעים (Dark Mode)
```css
--bg: #1c1d1f
--text: #f0f0f0 (בהיר)
--primary: #c088f5 (סגול בהיר)
--border: #4a4d4f
```

### עורך טקסט (RTE)
- גובה: 260px מינימום, גלילה עד 60% המסך
- סרגל: כפתורים מסודרים, אייקונים וודים
- בחומר: **עד 100MB**, סוגי קבצים רחב

---

## 📞 הערות לסשן הבא

1. **בלי עכבות** — אתה ביקשת להתקדם בלי שאלות. אני מוכן להמשיך ללא צורך בחיוב.
2. **תוכן בעברית בלבד** — כל הטקסט של המנועים צריך להיות בעברית (לא בנתוני הנוכחיים).
3. **שרטוטים וקבצים** — תבקש שרטוטים בעברית או קבצים בפורמט PDF/Word בעברית.
4. **ארכיטקטורה מגמות** — זה משינוי ארכיטקטור, אבל אפשרי עם מיגרציה ורלציות חדשות.

---

**סוף סיכום סשן.**
