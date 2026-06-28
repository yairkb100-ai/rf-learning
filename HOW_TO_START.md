# איך להפעיל את לומדת ענף 71

## 🚀 דרך 1: קובץ BAT (הפשוט ביותר)

### צעד 1: פתח את הקובץ
```
C:\Users\yairk\OneDrive\שולחן העבודה\rf-learning-system\START_LEARNING_SYSTEM.bat
```

### צעד 2: לחץ פעמיים (Double Click)
הקובץ יפתח **2 חלונות CMD**:
- ראשון: Backend (port 3000)
- שני: Frontend (port 5173)

### צעד 3: המתן 5 שניות
הדפדפן יפתח אוטומטית ל-`http://localhost:5173`

---

## 🐍 דרך 2: קובץ Python (אם BAT לא עובד)

### צעד 1: פתח CMD בתיקיית הפרויקט
```bash
cd "C:\Users\yairk\OneDrive\שולחן העבודה\rf-learning-system"
```

### צעד 2: הרץ את Python
```bash
python START_LEARNING_SYSTEM.py
```

או:
```bash
python3 START_LEARNING_SYSTEM.py
```

---

## ⚙️ דרך 3: יצירת Shortcut (לשולחן העבודה)

### לחלונות 10/11:
1. לחץ ימני על `START_LEARNING_SYSTEM.bat`
2. בחר: **Send to** → **Desktop (create shortcut)**
3. שם הקצר יופיע בשולחן העבודה
4. לחץ פעמיים על הקצר להפעלה

### או ידנית:
1. לחץ ימני בשולחן העבודה
2. בחר **New** → **Shortcut**
3. בשדה "Location of the item" הקלד:
   ```
   C:\Users\yairk\OneDrive\שולחן העבודה\rf-learning-system\START_LEARNING_SYSTEM.bat
   ```
4. לחץ **Next**, תן שם: `לומדת ענף 71`
5. סיים

---

## 📋 התחברות (לאחר הפתיחה)

כשהדפדפן נפתח ב-`http://localhost:5173`:

### ✅ התחברות כמנהל
```
ת"ז:    999999999
סיסמה:  postgres123
```
**גישה:** דף ניהול (`/admin`)

### ✅ התחברות כתלמיד
```
ת"ז:    123456789
סיסמה:  password123
```
**גישה:** דף בית (קורסים)

---

## ⚠️ בעיות נפוצות

### ❌ "Node.js not found"
**פתרון:** הורד Node.js מ-https://nodejs.org/

### ❌ "npm is not recognized"
**פתרון:** 
1. סגור את כל חלונות CMD
2. פתח CMD חדש
3. הרץ שוב את הקובץ

### ❌ "Port 3000/5173 already in use"
**פתרון:**
```bash
taskkill /F /IM node.exe
```
ואז הרץ שוב את הקובץ

### ❌ "Cannot connect to database"
**פתרון:**
1. בדוק שPostgreSQL רץ:
   - Windows: **Services** (services.msc) חפש "PostgreSQL"
   - או פתח **pgAdmin** וודא שהחיבור פעיל
2. אם לא עולה, הפעל את PostgreSQL ידנית

### ❌ "Database rf_learning not found"
**פתרון:** צור ב-pgAdmin:
1. לחץ ימני על **Databases**
2. בחר **Create** → **Database**
3. שם: `rf_learning`
4. Owner: `postgres`
5. לחץ **Save**

---

## 🛑 עצירת המערכת

### דרך 1: סגור את חלונות CMD
סגור את שני חלונות CMD (Backend ו-Frontend)

### דרך 2: Ctrl+C בחלון Python
אם השתמשת ב-Python, לחץ `Ctrl+C` בחלון Python

### דרך 3: Task Manager
```
Ctrl+Shift+Esc → חפש node.exe → לחץ ימני → End Task
```

---

## 📊 בדיקות בריאות

### כדי לוודא שהכל עובד:

1. **Backend תגובה:**
   ```
   http://localhost:3000/courses
   ```
   אמור להחזיר JSON עם קורסים

2. **Frontend עלה:**
   ```
   http://localhost:5173
   ```
   אמור להציג דף התחברות

3. **Database קיים:**
   ```bash
   # ב-pgAdmin Query Tool
   SELECT COUNT(*) FROM courses;
   ```
   אמור להחזיר מספר קורסים

---

## 🎯 טיפים

- **שמור קישור:** אחרי הפעלה ראשונה, הוסף `http://localhost:5173` ל-Bookmarks
- **Terminal תמיד פתוח:** משאיר את חלונות CMD פתוחים כדי לראות logs
- **Clear Screen:** באתה CMD, הקלד `cls` כדי לנקות המסך
- **Stop Server:** Ctrl+C בחלון Backend/Frontend כדי לעצור

---

## 📞 עזרה נוספת

- ראה `SESSION_SUMMARY.md` לסיכום הסשן
- ראה `STARTUP.md` להוראות נוספות
- ראה `FILES_CHANGED.txt` לרשימת קבצים ששונו

---

**סוף מדריך הפתיחה.**
