# 📚 לומדת ענף 71

Learning Management System (LMS) בעברית עם תוכן עיוני מעמיק.

## ✨ תכונות

- 👨‍🎓 **לתלמידים:** צפייה בקורסים, קריאת פרקים, פתרון בחינות
- 👨‍💼 **למנהלים:** יצירת קורסים, עריכת תוכן, ניהול בחינות
- 📝 **עורך טקסט עשיר** (WYSIWYG) ללא dependencies חיצוניות
- 📁 **ניהול קבצים** (PDF, Word, Excel, PowerPoint וכו')
- 🌙 **Dark/Light Mode** עם CSS Variables
- 🇮🇱 **תמיכה מלאה בעברית** (RTL)
- 📱 **Responsive Design** - עובד על כל המכשירים

## 🛠️ Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- CSS3 Modern (Grid, Flexbox)
- Heebo Font (עברית)

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL Database
- Multer (file uploads)

**Deployment:**
- Frontend: Vercel (free)
- Backend: Railway.app (free with $5 credit)
- Database: PostgreSQL on Railway

## 🚀 Quick Start

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Open:** http://localhost:5173

### Default Login

```
Admin:
ID: 999999999
Password: postgres123

Student:
ID: 123456789
Password: password123
```

## 📦 Deployment

### 🌟 Ready to Deploy? 

**See: [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)**  
Step-by-step guide to make your app live in 20 minutes!

### Option 1: Vercel + Railway (FREE!)

```bash
git push origin main
# Auto-deploys to Vercel + Railway
```

See: [docs/guides/GITHUB_DEPLOYMENT.md](./docs/guides/GITHUB_DEPLOYMENT.md)

### Option 2: DigitalOcean ($5/month)

See: [docs/guides/DEPLOYMENT_GUIDE.md](./docs/guides/DEPLOYMENT_GUIDE.md)

### Option 3: Local Network (Free)

See: [docs/guides/DEPLOYMENT_GUIDE.md](./docs/guides/DEPLOYMENT_GUIDE.md) - Local Network Section

## 📚 Documentation

- **[DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)** ⭐ - הוראות העלאה מלאות (התחל כאן!)
- [docs/summaries/SYSTEM_BOOK_FINAL.md](./docs/summaries/SYSTEM_BOOK_FINAL.md) - מדריך המערכת המלא
- [docs/guides/DEPLOYMENT_GUIDE.md](./docs/guides/DEPLOYMENT_GUIDE.md) - Deployment options
- [docs/guides/GITHUB_DEPLOYMENT.md](./docs/guides/GITHUB_DEPLOYMENT.md) - Free GitHub deployment
- [docs/guides/HOW_TO_START.md](./docs/guides/HOW_TO_START.md) - הוראות הפעלה

## 📂 Project Structure

```
rf-learning-system/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation
│   │   ├── config/         # Database, upload
│   │   └── server.ts       # Entry point
│   ├── uploads/            # User uploaded files
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Full pages
│   │   ├── context/        # Global state
│   │   ├── services/       # API calls
│   │   └── App.tsx         # Root component
│   ├── dist/               # Build output
│   └── package.json
│
├── START.bat               # One-click launcher
├── README.md               # This file
└── Documentation PDFs      # Guides & manuals
```

## 🔐 Security

- Passwords hashed with bcrypt
- JWT authentication
- SQL injection prevention (prepared statements)
- XSS protection (HTML sanitization)
- CORS configured
- Environment variables for secrets

## 🎓 Learning Content

Two full courses included:

1. **מנועי בוכנה** (Piston Engines)
   - 5 chapters with deep technical content
   - Advantages/disadvantages analysis
   - Technical specifications

2. **מנועי סילון** (Jet Engines)
   - 5 c