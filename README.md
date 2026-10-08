# ChatGPT Hebrew RTL

RTL ממוקד עברית עבור ChatGPT בדפדפן ועבור ChatGPT/Codex במחשב.

הפרויקט משלב שתי שכבות משלימות:

1. **מנוע תצוגת RTL** שמתקן כיוון, יישור, טבלאות, קוד ושדה כתיבה.
2. **RTL Skill** שמנחה את המודל לנסח עברית בצורה שלא נשברת כאשר משלבים טיקרים, אנגלית, אחוזים ומספרים.

## התקנה פשוטה ב־Codex למחשב

שלחו ל־Codex את [קישור הריפו](https://github.com/financialegg/chatgpt-hebrew-rtl) ובקשו ממנו: **"התקן עבורי את התמיכה המלאה בעברית וב־RTL לפי `INSTALL_FOR_CODEX.md`. בדוק את המתקין לפני ההרצה, ואל תסגור את Codex. בסיום הסבר לי איך להפעיל אותו מחדש."**

ב־Windows המתקין מוסיף תוסף כתיבה ויוצר בתפריט Start קיצור דרך בשם **Codex with Hebrew RTL**. נדרשים Codex Desktop ו־Node.js 22 ומעלה; אין צורך בהרשאות מנהל.

לאחר ההתקנה שמרו את העבודה, סגרו את כל חלונות Codex ופתחו **FinancialEgg → Codex with Hebrew RTL** מתפריט Start. השאירו את חלון המסוף פתוח בזמן השימוש. בדקו פסקה בעברית ושורה מעורבת, למשל `מניית NVDA עלתה ב־5.3% אחרי הדוח.`

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
- **כללי כתיבה בעברית (ChatGPT):** מגרסה 0.3.2 התוסף לא נוגע בהודעות. את הכללים מדביקים פעם אחת בהוראות המותאמות אישית של ChatGPT (Settings, Personalization, Custom Instructions), והם פועלים אוטומטית בכל שיחה. הטקסט המוכן: `docs/CUSTOM_INSTRUCTIONS_HE.txt`.

## התקנת התוסף בדפדפן

1. הורד או שכפל את הריפו.
2. פתח `chrome://extensions` או `edge://extensions`.
3. הפעל Developer mode.
4. לחץ Load unpacked.
5. בחר את התיקייה `browser-extension`.
6. רענן את ChatGPT.
7. פתח את חלון התוסף וסמן שקראת והסכמת. עד אז התוסף אינו פועל.

בתפריט התוסף אפשר לבחור:

- **חכם** – RTL רק כאשר התוכן דורש זאת.
- **RTL כפוי** – כופה RTL על תוכן שיחה שאינו קוד.
- **כבוי** – מסיר את שינויי התצוגה של התוסף.

## ChatGPT/Codex במחשב

מנוע שולחן העבודה משתמש ב־Chromium DevTools Protocol מקומי כדי להזריק את מנוע ה־RTL לאפליקציית Codex.

### Windows

המתקין האוטומטי נמצא ב־`scripts/install-windows.ps1`. הוראות ההתקנה המלאות נמצאות ב־[`INSTALL_FOR_CODEX.md`](INSTALL_FOR_CODEX.md). המתקין אינו מבקש הרשאות מנהל או משנה קובצי Codex.

### macOS ו־Linux

נדרשים Node.js 22 ומעלה. סגרו את האפליקציה והפעילו ידנית:

```bash
npm run desktop
```

אם האפליקציה לא מזוהה אוטומטית, ציינו את הנתיב המלא:

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

הבדיקה כוללת בדיקת תחביר, אימות JSON, ו־16 בדיקות לכיוון עברית/אנגלית, תוכן פיננסי מעורב, מדיניות BiDi, שחזור מצב, מתגים, רענון Desktop, ובדיקה שהתוסף לא משנה את ההודעה שנשלחת.

## מבנה

```text
chatgpt-hebrew-rtl/
├── core/
│   └── rtl-engine.js
├── browser-extension/
│   ├── manifest.json
│   ├── rtl-engine.js
│   ├── writing-rules.js
│   ├── content.js
│   ├── styles.css
│   ├── popup.html
│   └── popup.js
├── desktop/
│   └── launcher.mjs
├── plugins/
│   └── hebrew-rtl/
│       ├── plugin.json
│       └── skills/hebrew-rtl/SKILL.md
├── .agents/plugins/marketplace.json
├── docs/
│   └── PRIVACY_POLICY_HE.html
├── skill/
│   └── RTL_SKILL_HE.md
├── scripts/
│   ├── sync-extension.mjs
│   ├── check.mjs
│   └── install-windows.ps1
├── test/
│   └── core.test.mjs
├── .github/workflows/ci.yml
├── SECURITY.md
├── INSTALL_FOR_CODEX.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## פרטיות

תוסף הדפדפן פועל רק לאחר הסכמה, אינו שולח את תוכן השיחה לשרת חיצוני, אינו שומר אותו, ואינו משנה את ההודעות שאתה שולח. ההגדרות נשמרות מקומית באמצעות `chrome.storage.local`. ראו `PRIVACY.md` ו-`docs/PRIVACY_POLICY_HE.html`.

## סטטוס

**v0.3.2** – הוסרה ההוספה של כללי הכתיבה להודעות. הכללים הודבקו בכל הודעה בעברית, הופיעו בבועה וחזרו בכל שיחה. עכשיו הם עוברים דרך Custom Instructions של ChatGPT, והתוסף מטפל רק בתצוגה.

**v0.3.1** – כתיבה עברית חכמה והסכמה בתוסף הדפדפן.

ב-0.3.1 תוקן: `styles.css` חל תמיד, גם לפני הסכמה ובמצב כבוי. כל הכללים מוגבלים עכשיו ל-`html[data-hebrew-rtl-active]`, שהמנוע מוסיף רק כשהתוסף פעיל.

בגרסה זו נוסף:
- שכבת כתיבה חכמה (30 כללים) שמתווספת להודעות בעברית לאחר הסכמה. הוסרה ב-0.3.2.

בגרסה 0.2.1 תוקנו:
- שימוש ב־`unicode-bidi: isolate` לאחר זיהוי כיוון מפורש, כדי שטיקר בתחילת משפט עברי לא יהפוך את בסיס הפסקה ל־LTR.
- שחזור `dir` וסגנונות מקוריים כאשר מכבים את התוסף או אפשרות ספציפית.
- ניקוי מיידי של טבלאות ושדה הכתיבה כאשר מכבים את המתגים שלהם.
- הימנעות משינויים בתוך עץ ה־DOM של עורך הכתיבה.
- הזרקה חוזרת בטוחה ב־ChatGPT/Codex Desktop אחרי רענון או ניווט.

התמיכה בדסקטופ עדיין דורשת אימות מעשי מול גרסת ChatGPT/Codex המותקנת בפועל, משום שמבנה ואפשרויות ההפעלה של אפליקציות Electron יכולים להשתנות בין גרסאות.

## Chrome Web Store

לפרסום בחנות Chrome השתמשו בקובץ האריזה שנוצר על ידי workflow בשם `Package Chrome Web Store`.

פרטי ה-listing, הרשאות, קישורי פרטיות ותמיכה נמצאים ב-`CHROME_WEB_STORE.md`, ומדיניות הפרטיות נמצאת ב-`PRIVACY.md`.

## רישיון

MIT.
