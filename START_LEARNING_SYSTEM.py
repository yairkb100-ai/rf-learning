#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
לומדת ענף 71 - הפעלה אוטומטית
יריץ Backend + Frontend + פתח דפדפן
"""

import subprocess
import time
import sys
import os
import webbrowser
from pathlib import Path

# הגדרות נתיבים
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

def print_header():
    print("\n" + "="*50)
    print("  לומדת ענף 71 - מערכת הלמידה")
    print("="*50 + "\n")

def check_node():
    """בדיקה שNode.js מותקן"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        print(f"✓ Node.js: {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("❌ שגיאה: Node.js לא מותקן")
        print("   הורד מ: https://nodejs.org/")
        return False

def start_backend():
    """הפעלת Backend"""
    print("\n[1/3] הפעלת Backend (http://localhost:3000)...")
    try:
        subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(BACKEND_DIR),
            shell=True
        )
        print("✓ Backend הופעל בחלון נפרד")
        time.sleep(2)
        return True
    except Exception as e:
        print(f"❌ שגיאה בהפעלת Backend: {e}")
        return False

def start_frontend():
    """הפעלת Frontend"""
    print("[2/3] הפעלת Frontend (http://localhost:5173)...")
    try:
        subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(FRONTEND_DIR),
            shell=True
        )
        print("✓ Frontend הופעל בחלון נפרד")
        time.sleep(2)
        return True
    except Exception as e:
        print(f"❌ שגיאה בהפעלת Frontend: {e}")
        return False

def open_browser():
    """פתיחת דפדפן"""
    print("[3/3] פתיחת הדפדפן...")
    try:
        time.sleep(3)
        webbrowser.open("http://localhost:5173")
        print("✓ דפדפן נפתח")
        return True
    except Exception as e:
        print(f"⚠️  לא הצלחנו לפתוח דפדפן: {e}")
        print("   פתח ידנית: http://localhost:5173")
        return False

def print_summary():
    """הדפסת סיכום"""
    print("\n" + "="*50)
    print("  המערכת הופעלה בהצלחה!")
    print("="*50)
    print("""
✓ Backend:  http://localhost:3000
✓ Frontend: http://localhost:5173

התחברות:
  👨‍💼 מנהל: ת"ז 999999999 / סיסמה postgres123
  👨‍🎓 תלמיד: ת"ז 123456789 / סיסמה password123

💡 כדי להפסיק את המערכת:
  - סגור את חלונות CMD/Terminal של Backend ו-Frontend

📖 לעזרה: ראה SESSION_SUMMARY.md ו-STARTUP.md
""")
    print("="*50 + "\n")

def main():
    print_header()

    # בדיקות
    if not check_node():
        sys.exit(1)

    # הפעלה
    if not start_backend():
        sys.exit(1)

    if not start_frontend():
        sys.exit(1)

    # פתיחת דפדפן
    open_browser()

    # סיכום
    print_summary()

    # שמור את התוכנית פעילה
    print("תוכנית פעילה. לסגירה לחץ Ctrl+C\n")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nסגירת המערכת...")
        sys.exit(0)

if __name__ == "__main__":
    main()
