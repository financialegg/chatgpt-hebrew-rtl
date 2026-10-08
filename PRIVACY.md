# מדיניות פרטיות: Hebrew RTL for ChatGPT

עודכן לאחרונה: 8 באוקטובר 2026 (גרסה 0.3.2)

## מטרת התוסף

התוסף נועד למטרה אחת: לשפר את התצוגה של עברית בתוך ChatGPT. הוא מציג עברית מימין לשמאל ושומר על אנגלית, קוד, טיקרים, מספרים וטבלאות בכיוון המתאים.

## הסכמה

התוסף אינו קורא תוכן בדף ואינו מוסיף הנחיות לפני שהמשתמש מסמן בחלון התוסף שקרא והסכים להפעלתו. אפשר לבטל את ההסכמה בכל עת בביטול הסימון, ועיבוד התוכן נעצר מיד.

## איזה מידע התוסף מעבד

לאחר הסכמה, התוסף קורא באופן מקומי את הטקסט המוצג בשיחה ב-chatgpt.com ואת הטקסט בשדה הכתיבה. הוא משתמש בטקסט רק כדי לזהות עברית ולקבוע כיוון תצוגה.

התוסף לא משנה ולא מוסיף דבר להודעות שהמשתמש שולח.

## מה התוסף לא עושה

- אינו שולח תוכן שיחות לשרת של המפתח או לצד שלישי.
- אינו שומר תוכן שיחות.
- אינו אוסף היסטוריית גלישה.
- אינו משתמש באנליטיקה או במעקב ואינו מציג פרסומות.
- אינו מוכר או משתף מידע אישי.
- אינו מריץ קוד מרוחק ואינו מבצע בקשות רשת משלו.
- אינו משנה את הוראות המערכת של ChatGPT.

## אחסון מקומי

התוסף שומר ב-`chrome.storage.local` רק הגדרות: ההסכמה, מצב התצוגה והפעלת תיקון טבלאות, שדה כתיבה וכתיבה חכמה.

## הרשאות

- `storage`: לשמירת ההגדרות מקומית.
- גישה ל-`https://chatgpt.com/*`: לקריאת הטקסט בדף ולהחלת תיקוני ה-RTL, באתר זה בלבד.

התוסף אינו מבקש גישה לאתרים אחרים.

## יצירת קשר ותמיכה

ניתן לפתוח Issue בריפו הציבורי: https://github.com/financialegg/chatgpt-hebrew-rtl/issues

---

# Privacy Policy: Hebrew RTL for ChatGPT

Last updated: October 8, 2026 (version 0.3.2)

The extension has one purpose: to improve Hebrew display inside ChatGPT. It renders Hebrew right-to-left and keeps English, code, tickers, numbers and tables in the appropriate direction.

**Consent.** The extension does not read page content until the user ticks the consent box in the extension popup. Consent can be withdrawn at any time, which stops processing immediately.

**What it processes.** After consent, the extension locally reads the visible conversation text on chatgpt.com and the text in the composer, only to detect Hebrew and decide display direction. It never changes or adds to the messages the user sends.

**What it does not do.** It does not transmit conversation content to the developer or any third party, store conversation content, collect browsing history, use analytics or tracking, show advertising, sell or share personal information, execute remote code or make network requests of its own. It does not modify ChatGPT's internal system instructions.

**Storage.** Only settings (consent, display mode, and the table, composer and smart-writing toggles) are stored in `chrome.storage.local`.

**Permissions.** `storage`, and host access to `https://chatgpt.com/*` only.

**Contact.** Open an issue at https://github.com/financialegg/chatgpt-hebrew-rtl/issues
