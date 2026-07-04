import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ============================================================================
// נקודת הכניסה של האפליקציה (Application Entry Point)
// ----------------------------------------------------------------------------
// תפקיד:
//   מרנדר את רכיב השורש <App /> לתוך אלמנט ה-DOM עם id="root" (מוגדר ב-index.html).
//   זהו הקובץ הראשון שרץ בעת טעינת האתר בדפדפן.
//
// הקשר במערכת:
//   • StrictMode — עוטף את האפליקציה ומסייע לזהות בעיות פוטנציאליות בפיתוח.
//   • index.css — קובץ העיצוב הגלובלי הבסיסי.
// ============================================================================

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
