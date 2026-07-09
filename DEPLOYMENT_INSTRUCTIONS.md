# 🚀 הוראות העלאה לציבור — שלב אחר שלב

## סטטוס נוכחי
✅ הקוד מוכן ל-Deployment  
✅ כל הקבצים מסודרים  
✅ Git repository מוגדר  

---

## שלב 1: דחיפה ל-GitHub (מהמחשב שלך)

פתח Terminal/Command Prompt בתיקייה הראשית של הפרויקט:

```bash
cd rf-learning-system
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## שלב 2: העלאת Frontend ל-Vercel (FREE!)

### 2.1 כנס ל-Vercel

1. הנח לכאן: https://vercel.com
2. לחץ "Sign in" → בחר "GitHub"
3. אתר את הrepo `rf-learning` שלך

### 2.2 Import Repository

```
1. Dashboard → Add New → Project
2. Import Git Repository
3. בחר: rf-learning
4. לחץ: Import
```

### 2.3 הגדר Environment Variables

לפני ש-Deploy, הוסף את זה בVersell settings:

```
VITE_API_URL = https://api.railway.app/api
```

(נעדכן את הURL הזה אחר כך כשRailway יתן לנו את זה)

### 2.4 Deploy!

```
לחץ: Deploy
```

⏳ רדוף 2-3 דקות...  
✅ Frontend LIVE at: `https://rf-learning.vercel.app`

---

## שלב 3: העלאת Backend ל-Railway (FREE!)

### 3.1 כנס ל-Railway

1. הנח לכאן: https://railway.app
2. לחץ "Login" → בחר "GitHub"
3. אתר את הrepo `rf-learning` שלך

### 3.2 צור New Project

```
1. Dashboard → New Project
2. Deploy from GitHub repo
3. בחר: rf-learning
4. בחר את ה-folder: backend/
```

### 3.3 הוסף PostgreSQL Database

```
1. Backend Service → Add Service → Add from Marketplace
2. בחר: PostgreSQL
3. לחץ: Add
```

### 3.4 הגדר Environment Variables

בRailway Dashboard, בקטגוריה "Backend", הוסף:

```
NODE_ENV = production
SERVER_PORT = 3000
DB_HOST = (automatic - מRailway)
DB_PORT = (automatic)
DB_USER = postgres
DB_PASSWORD = (automatic - מRailway)
DB_NAME = rf_learning
JWT_SECRET = your-secret-key-change-this-NOW
UPLOAD_DIR = /tmp/uploads
FRONTEND_URL = https://rf-learning.vercel.app
```

### 3.5 Railway Auto-Deploy

כשאתה pushדים ל-GitHub, Railway automatically:
1. builds את backend
2. connects ל-PostgreSQL
3. deploys

✅ Backend LIVE at: `https://api.railway.app/api/courses`  
(Railway יתן לך את הURL המדויק)

---

## שלב 4: Setup Database

### 4.1 צור טבלאות

1. Railway Dashboard → PostgreSQL Service
2. בחר "Connect" → "Query"
3. העתק את התוכן מ: `backend/src/db.sql`
4. דבק והרץ

תוך דקה, כל הטבלאות יוצרו!

---

## שלב 5: עדכן Frontend עם Backend URL

### 5.1 קבל את ה-URL מRailway

Railway Dashboard → Backend Service → Networking  
העתק את ה-URL (יראה כמו: `https://rf-learning-api.railway.app`)

### 5.2 עדכן את Frontend

בקובץ `frontend/.env.production`:

```
VITE_API_URL=https://rf-learning-api.railway.app/api
```

### 5.3 Commit ו-Push

```bash
git add frontend/.env.production
git commit -m "Update backend URL for production"
git push origin main
```

Vercel automatically redeploys! ✅

---

## ✅ בדוק שהכל עובד

### Frontend Test
```
https://rf-learning.vercel.app
```
אתר צריך להיות חי ✅

### Login Test
```
Admin ID: 999999999
Password: postgres123
```

### API Test
```
https://rf-learning-api.railway.app/api/courses
```
צריך לקבל JSON של קורסים ✅

---

## 🎉 סיכום

| שלב | שירות | עלות | סטטוס |
|------|--------|-------|--------|
| Frontend | Vercel | FREE | ✅ |
| Backend | Railway | ~FREE | ✅ |
| Database | Railway | FREE | ✅ |
| SSL/HTTPS | Both | FREE | ✅ |
| **Total** | | **$0/month** | **✅** |

---

## Day-to-Day Workflow

כשאתה עושה עדכונים:

```bash
# בצד שלך
npm run dev  # test locally

# כשהכל טוב:
git add .
git commit -m "Add new feature"
git push origin main

# Vercel + Railway automatically redeploy! 🎉
```

---

## Troubleshooting

### "Frontend can't connect to Backend"
→ בדוק שה-URL בfrontend/.env.production נכון  
→ push לGitHub  
→ Vercel redeploys

### "Database error"
→ בדוק בRailway שPostgreSQL חי  
→ בדוק שה-environment variables כונים  
→ run את db.sql שוב

### "Login not working"
→ בדוק שDB tables נוצרו  
→ בדוק שJWT_SECRET הוא unique  
→ restart את Backend service

---

## 📱 כעת אתה לייב! 🚀

```
👥 עבור תלמידים:
https://rf-learning.vercel.app

👨‍💼 עבור מנהלים:
https://rf-learning.vercel.app
Admin: 999999999 / postgres123
```

**מאחלים בהצלחה! 🎓**

---

**עדכון:** 2026-07-08  
**סטטוס:** Ready for Deployment
