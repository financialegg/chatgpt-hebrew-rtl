# הוראות התקנה ל־Codex

הריפו מספק שני רכיבים נפרדים:

1. תוסף Codex עם הנחיות לכתיבה בעברית ובטקסט מעורב.
2. מתקין ל־Windows שמוסיף מזריק תצוגת RTL ל־Codex Desktop.

התוסף לבדו **אינו משנה את תצוגת החלון של Codex**. להתקנה מלאה ב־Windows פעל לפי ההוראות הבאות.

## כשמשתמש מבקש התקנה מקישור הריפו

1. הסבר בקצרה שהתמיכה המלאה בתצוגת Codex למחשב מיועדת כרגע ל־Windows ודורשת Codex Desktop ו־Node.js 22 ומעלה.
2. שכפל או הורד את הריפו לתיקייה זמנית, ועיין בקובץ `scripts/install-windows.ps1` לפני הפעלתו.
3. הרץ PowerShell מתוך תיקיית הריפו:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1
   ```

   אל תשנה את מדיניות ההרצה של המחשב. `-ExecutionPolicy Bypass` חל רק על תהליך PowerShell הזה. המתקין אינו מבקש הרשאות מנהל, אינו משנה קובצי Codex ואינו סוגר את האפליקציה.
4. לאחר הצלחה, אמור למשתמש לשמור את העבודה ולסגור את כל חלונות Codex לחלוטין.
5. בקש ממנו לפתוח מתפריט Start את **FinancialEgg → Codex with Hebrew RTL**. יש להשאיר את חלון המסוף פתוח בזמן השימוש ב־Codex, כי הוא מפעיל את מנוע התצוגה המקומי.
6. בקש לבדוק פסקה בעברית ושורה מעורבת, למשל: `מניית NVDA עלתה ב־5.3% אחרי הדוח.` אם התצוגה אינה תקינה, בקש את פלט ההתקנה ואת הודעות חלון המסוף.

אל תטען שהתצוגה פעילה לפני שהמשתמש מפעיל את Codex דרך קיצור הדרך. נדרשת הפעלה מחדש כדי שמנוע התצוגה יתחבר בזמן עליית האפליקציה.

## מה המתקין משנה

- מתקין את התוסף `hebrew-rtl` דרך Codex CLI.
- מעתיק את מנוע ה־RTL ואת המזריק אל `%LOCALAPPDATA%\FinancialEgg\HebrewRTL`.
- יוצר קיצור דרך בתפריט Start תחת **FinancialEgg**.
- אינו מבקש הרשאות מנהל, אינו משנה קובצי Codex ואינו שולח תוכן שיחות לשרת. המזריק משתמש ביציאת Chromium DevTools מקומית; קראו את [SECURITY.md](SECURITY.md).

אם Codex Desktop, Codex CLI או Node.js 22 ומעלה אינם מותקנים או אינם מזוהים, המתקין נעצר ומדווח מה חסר לפני ביצוע שינויים. התקן את הדרישה החסרה והריץ שוב.

## התקנה ידנית של התוסף

אפשר להתקין את תוסף הכתיבה דרך Codex CLI:

```text
codex plugin marketplace add financialegg/chatgpt-hebrew-rtl
codex plugin add hebrew-rtl@financialegg-hebrew-rtl
```

כדי לקבל גם תצוגת RTL ב־Codex Desktop ב־Windows, הרץ בנוסף את `scripts/install-windows.ps1`.

תוסף הדפדפן מיועד ל־ChatGPT ב־Chrome או ב־Edge. הוא אינו משפיע על Codex Desktop.
