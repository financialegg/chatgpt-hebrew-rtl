# ChatGPT Hebrew RTL

RTL ממוקד עברית עבור ChatGPT בדפדפן ועבור ChatGPT/Codex במחשב.

הפרויקט משלב שתי שכבות משלימות:

1. **מנוע תצוגת RTL** שמתקן כיוון, יישור, טבלאות, קוד ושדה כתיבה.
2. **RTL Skill** שמנחה את המודל לנסח עברית בצורה שלא נשברת כאשר משלבים טיקרים, אנגלית, אחוזים ומספרים.

## יכולות

- זיהוי אוטומטי של פסקה עברית או אנגלית.
- טיפול בטקסט מעורב עברית/אנגלית.
- התאמה לתוכן פיננסי כגון `NVDA`, `S&P 500`, `HBM/DRAM`, אחוזים ומחירים.
- שמירת קוד, נוסחאות וכתובות אינטרנט ב־LTR.
- טבלאות עבריות ב־RTL ותאי טבלה לפי שפת התוכן.
- שדה כתיבה שמחליף כיוון תוך כדי הקלדה.
- תמיכה בתשובות שמגיעות בסטרימינג באמצעות `MutationObserver`.
- בידוד אזור השיחה כדי לא להפוך את הניווט והסרגלים של ChatGPT.
- שלושה מצבים: `smart`, `force`, `off`.

## התקנת התוסף בדפדפן

1. הורד או שכפל את הריפו.
2. פתח `chrome://extensions` או `edge://extensions`.
3. הפעל Developer mode.
4. לחץ Load unpacked.
5. בחר את התיקייה `browser-extension`.
6. רענן את ChatGPT.

בתפריט התוסף אפשר לבחור:

- **חכם** – RTL רק כאשר התוכן דורש זאת.
- **RTL כפוי** – כופה RTL על תוכן שיחה שאינו קוד.
- **כבוי** – מסיר את שינויי התצוגה של התוסף.

## ChatGPT/Codex במחשב

גרסת ה־Desktop היא MVP שמשתמש באותו מנוע ומזריק אותו לאפליקציית Electron דרך Chrome DevTools Protocol מקומי.

דרישות:

- Node.js 22 ומעלה.
- יש לסגור את ChatGPT/Codex לפני ההפעלה הראשונה.

הפעלה:

```bash
npm run desktop
```

אם האפליקציה לא מזוהה אוטומטית:

```bash
node desktop/launcher.mjs --exe "C:\\Path\\To\\Codex.exe"
```

מצב כפוי:

```bash
node desktop/launcher.mjs --mode force
```

ה־launcher קושר את DevTools ל־`127.0.0.1` ובוחר פורט מקומי פנוי. לפרטים ראה `SECURITY.md`.

## RTL Skill

הקובץ `skill/RTL_SKILL_HE.md` מיועד להדבקה בהוראות קבועות/Custom Instructions או לשימוש כקובץ הוראות בפרויקט שתומך בכך.

ה־Skill מטפל **בניסוח**. מנוע ה־RTL מטפל **בתצוגה**. מומלץ להשתמש בשניהם.

## פיתוח

קובץ המקור של המנוע הוא:

```text
core/rtl-engine.js
```

העותק שבתוסף נוצר ממנו:

```bash
npm run build
```

בדיקה מלאה:

```bash
npm run verify
```

הבדיקה כוללת בדיקת תחביר, אימות JSON, ו־14 בדיקות לכיוון עברית/אנגלית, תוכן פיננסי מעורב, מדיניות BiDi, שחזור מצב, מתגים ורענון Desktop.

## מבנה

```text
chatgpt-hebrew-rtl/
├── core/
│   └── rtl-engine.js
├── browser-extension/
│   ├── manifest.json
│   ├── rtl-engine.js
│   ├── content.js
│   ├── styles.css
│   ├── popup.html
│   └── popup.js
├── desktop/
│   └── launcher.mjs
├── skill/
│   └── RTL_SKILL_HE.md
├── scripts/
│   ├── sync-extension.mjs
│   └── check.mjs
├── test/
│   └── core.test.mjs
├── .github/workflows/ci.yml
├── SECURITY.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## פרטיות

תוסף הדפדפן אינו שולח את תוכן השיחה לשרת חיצוני. ההגדרות נשמרות מקומית באמצעות `chrome.storage.local`.

## סטטוס

**v0.2.0** – גרסת תיקונים עם 14 בדיקות אוטומטיות ו־CI ירוק.

בגרסה זו תוקנו:
- שימוש ב־`unicode-bidi: isolate` לאחר זיהוי כיוון מפורש, כדי שטיקר בתחילת משפט עברי לא יהפוך את בסיס הפסקה ל־LTR.
- שחזור `dir` וסגנונות מקוריים כאשר מכבים את התוסף או אפשרות ספציפית.
- ניקוי מיידי של טבלאות ושדה הכתיבה כאשר מכבים את המתגים שלהם.
- הימנעות משינויים בתוך עץ ה־DOM של עורך הכתיבה.
- הזרקה חוזרת בטוחה ב־ChatGPT/Codex Desktop אחרי רענון או ניווט.

התמיכה בדסקטופ עדיין דורשת אימות מעשי מול גרסת ChatGPT/Codex המותקנת בפועל, משום שמבנה ואפשרויות ההפעלה של אפליקציות Electron יכולים להשתנות בין גרסאות.

## רישיון

MIT.
