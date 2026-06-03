/** Hebrew release notes, newest date first. */
export type ChangelogDay = {
  /** ISO date (YYYY-MM-DD) for sorting and display */
  date: string
  /** App version when known */
  version?: string
  items: string[]
}

export const CHANGELOG_HE: ChangelogDay[] = [
  {
    date: '2026-06-02',
    version: '1.0.11',
    items: [
      'תיקון שורת אייקונים חברתיים ב-Outlook Classic — ריווח שווה, בלי חיתוך, יישור RTL',
      'תיקון אייקון אינסטגרם (גרדיאנט) שלא הוצג במלואו',
      'יישור טלפון, דוא"ל ואתר עם שם ותפקיד — עם אפשרות שליטה בפריסה',
      'תיקון שבירת כתובת דוא"ל ארוכה בתצוגה במobile',
      'אשף התקנה ל-Outlook: הפעלה מחדש אוטומטית, דילוג על גופן כשהשם כתמונה, פתיחת תיקיית הורדות',
      'ברירת מחדל: שם ותפקיד מוצגים כתמונות לנמענים בלי Rubik/Cairo',
      'גיבוי גופן ו-fallback ל-Arial ב-Outlook',
      'יישור חבילת IT ZIP עם ייצוא bulk',
      'שמירת ZIP ל-IT בתיקיית Documents\\Signatures',
      'שם קובץ חתימה לפי כתובת דוא"ל',
      'תיקון HTML וריווח במתקין Outlook',
      'תיקון נתיבי תמונות _files (בלי %20) ל-Outlook Classic',
      'עדכון גרסה אוטומטי בכל commit',
      'תמונות חתימה כקבצים מקושרים (לא base64) לעריכה ב-Outlook',
      'הצגת גרסה וזמן build בפינת המסך',
      'ייצוא ZIP ל-IT אחרי התקנה + bulk signatures',
      'תמיכה בשמות עבריים בהתקנה Classic Outlook'
    ]
  },
  {
    date: '2026-05-31',
    version: '1.0.6',
    items: [
      'שמירת חתימות בענן (Vercel Blob)',
      'שמירה/טעינה לפי שם בתוך הדפדפן',
      'תיקון גלישה בשורת הכלים',
      'ייצוא תמונות כקבצים ב-ZIP וייבוא ZIP',
      'צבעים נפרדים לכל חלק בחתימה + תצוגת Outlook',
      'וריאציות אייקונים חברתיים עם גרדיאנט אינסטגרם',
      'HTML צבעוני בטוח בשם, תפקיד וחברה'
    ]
  }
]

export const formatChangelogDateHe = (isoDate: string): string => {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
