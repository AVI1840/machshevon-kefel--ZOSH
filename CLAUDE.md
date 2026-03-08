# CLAUDE.md — מחשבון כפל גמלאות

## מה הפרויקט עושה
מחשבון לפקידי ביטוח לאומי — השוואה בין גמלת שאירים לנכות כללית במצב של כפל זכאות (סעיף 320).
חישוב מדויק לפי חוזר תשלומים 33, סכומים מעודכנים 2026. שמירת לקוחות, ייצוא DOCX.

## סטאק
React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui

## קבצים חשובים
- `src/utils/calculations.ts` — לוגיקת חישוב (אל תשנה ללא מקור חוקי)
- `src/utils/constants.ts` — סכומי גמלאות מעודכנים 2026
- `src/components/Header.tsx` — header עם branding
- `src/components/FeedbackModal.tsx` — מערכת משוב פיילוט עם localStorage
- `src/pages/Index.tsx` — דף ראשי עם טפסים ותוצאות
- `src/hooks/useSavedClients.ts` — שמירת לקוחות ב-localStorage

## כללי עבודה ל-AI

### מה מותר
- שיפורי UI ועיצוב
- הוספת הסברים ו-tooltips
- שיפור ייצוא DOCX
- תיקון באגים

### מה אסור
- **אל תשנה** calculations.ts — הלוגיקה מדויקת לפי חוק
- **אל תשנה** constants.ts — סכומים מאומתים
- **אל תשנה** את הקרדיט: "אביעד יצחקי, מינהל גמלאות"
- **אל תשדרג** ספריות ללא בדיקה

## Build
```
npm install
npm run build
```

## Deploy
GitHub Pages via GitHub Actions
URL: https://aviad1840.github.io/machshevon-kefel/
