/**
 * Content source for the statically generated SEO pages.
 *
 * These are real, standalone HTML pages (no JS, no hydration) so that crawlers
 * and users see byte-identical content. The SPA at `/` and `/he` cannot carry
 * this content because its markup only exists after React renders.
 */

export const SITE_URL = 'https://signitures.dev'
export const BRAND_COLOR = '#88236f'

/** Locale-level strings: app-shell metadata, chrome, and shared labels. */
export const locales = {
  en: {
    lang: 'en',
    dir: 'ltr',
    /** URL prefix for this locale. English is at the root. */
    base: '',
    appTitle: 'Free Outlook Email Signature Generator',
    appDescription:
      'Design a professional Outlook email signature in your browser, then roll it out to your whole team from an Excel sheet. Free, no signup to start, works with Outlook desktop, web, and mobile.',
    ogTitle: 'Free Outlook Email Signature Generator',
    siteName: 'Signitures',
    guidesTitle: 'Email signature guides',
    guidesDescription:
      'Practical guides to building, installing, and rolling out Outlook email signatures that render correctly everywhere.',
    backToApp: 'Open the signature generator',
    backToGuides: 'All guides',
    home: 'Home',
    guides: 'Guides',
    ctaHeading: 'Build your signature now',
    ctaBody:
      'Fill in your details, pick a layout, and download a signature ready to drop into Outlook. Free to use.',
    ctaButton: 'Open the generator',
    faqHeading: 'Frequently asked questions',
    relatedHeading: 'Related guides',
    updatedLabel: 'Updated',
    tocHeading: 'On this page'
  },
  he: {
    lang: 'he',
    dir: 'rtl',
    base: '/he',
    appTitle: 'מחולל חתימות למייל לאאוטלוק — חינם',
    appDescription:
      'בונים חתימת מייל מקצועית לאאוטלוק ישירות בדפדפן, ומפיצים אותה לכל העובדים בארגון מקובץ אקסל. חינם, בעברית, עובד באאוטלוק דסקטופ, ווב ומובייל.',
    ogTitle: 'מחולל חתימות למייל לאאוטלוק',
    siteName: 'Signitures',
    guidesTitle: 'מדריכים לחתימת מייל',
    guidesDescription:
      'מדריכים מעשיים לבנייה, התקנה והפצה של חתימות מייל לאאוטלוק שנראות נכון בכל תוכנת דואר.',
    backToApp: 'למחולל החתימות',
    backToGuides: 'כל המדריכים',
    home: 'דף הבית',
    guides: 'מדריכים',
    ctaHeading: 'בנו את החתימה שלכם עכשיו',
    ctaBody:
      'ממלאים פרטים, בוחרים עיצוב, ומורידים חתימה מוכנה להדבקה באאוטלוק. השימוש חינם.',
    ctaButton: 'פתחו את המחולל',
    faqHeading: 'שאלות נפוצות',
    relatedHeading: 'מדריכים נוספים',
    updatedLabel: 'עודכן',
    tocHeading: 'בעמוד הזה',
    heroTitle: 'מחולל חתימות למייל לאאוטלוק'
  }
}

/**
 * Guides are keyed by slug so each locale's version is discoverable as an
 * hreflang alternate of the others.
 */
export const guides = [
  {
    slug: 'outlook-email-signature',
    updated: '2026-08-05',
    en: {
      title: 'How to Add an Email Signature in Outlook (Desktop, Web & Mobile)',
      description:
        'Step-by-step instructions for adding an HTML email signature to new Outlook, classic Outlook, Outlook on the web, and the iOS and Android apps.',
      h1: 'How to add an email signature in Outlook',
      intro:
        'Outlook stores signatures differently depending on which version you use, which is why a signature that works on your desktop often disappears on your phone. This guide covers all four places you need to set it, and what to do when the signature loses its formatting.',
      sections: [
        {
          h2: 'New Outlook for Windows and Outlook on the web',
          paragraphs: [
            'New Outlook and Outlook on the web share the same signature store, so setting it in one place applies it to the other automatically. The signature lives on your Microsoft 365 mailbox rather than on the machine.'
          ],
          steps: [
            'Open Settings from the gear icon in the top-right corner.',
            'Go to Mail, then Compose and reply.',
            'Under Email signature, give the signature a name.',
            'Paste your signature into the editor. Copy it from the rendered preview, not from the HTML source, so the formatting carries over.',
            'Choose whether to apply it to new messages, replies and forwards, or both.',
            'Select Save.'
          ],
          note: 'The web editor strips some CSS. If your layout collapses, the signature is likely relying on CSS that Outlook removes — see the HTML best practices guide below.'
        },
        {
          h2: 'Classic Outlook for Windows',
          paragraphs: [
            'Classic Outlook keeps signatures as files on disk, in three parts: an .htm file, a .txt fallback, and a folder holding the images. Because the images are referenced from that folder, copying only the .htm file to another machine produces a signature with broken image placeholders.'
          ],
          steps: [
            'Go to File, then Options, then Mail, then Signatures.',
            'Select New and name the signature.',
            'Paste the rendered signature into the edit box.',
            'Set the default signature for new messages and for replies and forwards.',
            'Select OK.'
          ],
          note: 'The signature files live in %APPDATA%\\Microsoft\\Signatures. Dropping a prepared .htm file plus its matching image folder there installs a signature without any manual pasting — which is how bulk deployment works.'
        },
        {
          h2: 'Outlook for Mac',
          paragraphs: [
            'Outlook for Mac stores signatures locally in the app profile. Signatures do not sync from the Windows client, so they must be set once per machine.'
          ],
          steps: [
            'Open Outlook, then Settings, then Signatures.',
            'Select the plus button to add a signature.',
            'Paste the rendered signature and name it.',
            'Assign it as the default for your account under Choose default signature.'
          ]
        },
        {
          h2: 'Outlook for iOS and Android',
          paragraphs: [
            'The mobile apps only support plain text signatures. There is no way to set an HTML signature with a logo directly in the app. Replies composed on mobile will use this plain text version, so keep it short — usually a name, title, and phone number.',
            'If your organisation needs a consistent HTML signature on mobile too, it has to be applied server-side with an Exchange transport rule, which appends it to messages as they leave the server.'
          ],
          steps: [
            'Open the app and tap your profile icon.',
            'Tap the gear icon to open Settings.',
            'Tap Signature.',
            'Replace the default text and confirm.'
          ]
        },
        {
          h2: 'When the signature loses its formatting',
          paragraphs: [
            'Three causes account for almost every broken signature. First, the message is being composed in plain text rather than HTML — check the Format Text tab. Second, the signature was copied from HTML source instead of from a rendered page, so Outlook pastes the markup as visible text. Third, the layout uses modern CSS such as flexbox or grid, which the Word rendering engine behind Outlook for Windows does not support.',
            'The generator produces table-based, inline-styled markup specifically to avoid the third case.'
          ]
        }
      ],
      faq: [
        {
          q: 'Why does my Outlook signature image not show up for recipients?',
          a: 'The image is almost certainly linked from your local disk rather than embedded or hosted. Recipients cannot reach a path on your machine. Either embed the image in the signature or host it at a public URL.'
        },
        {
          q: 'Can I have different signatures for new emails and replies?',
          a: 'Yes. Every Outlook version lets you assign one signature for new messages and a different one for replies and forwards. A common setup is a full signature on new mail and a short one on replies.'
        },
        {
          q: 'Does an Outlook signature sync across my devices?',
          a: 'Only in new Outlook and Outlook on the web, which store the signature on the mailbox. Classic Outlook for Windows and Outlook for Mac store signatures locally, so each machine has to be set up separately.'
        },
        {
          q: 'How do I add my signature to Outlook automatically for everyone in the company?',
          a: 'Either deploy the signature files to each user profile with a script or group policy, or apply the signature server-side using an Exchange transport rule. Exporting a bulk set of per-employee signature files makes the first approach practical.'
        }
      ]
    },
    he: {
      title: 'איך מוסיפים חתימה במייל באאוטלוק — מדריך לדסקטופ, ווב ומובייל',
      description:
        'מדריך שלב אחר שלב להוספת חתימת HTML לאאוטלוק החדש, לאאוטלוק הקלאסי, לאאוטלוק בדפדפן ולאפליקציות אייפון ואנדרואיד.',
      h1: 'איך מוסיפים חתימה במייל באאוטלוק',
      intro:
        'אאוטלוק שומר חתימות בדרך שונה בכל גרסה, ולכן חתימה שעובדת במחשב לרוב נעלמת בטלפון. המדריך הזה עובר על ארבעת המקומות שבהם צריך להגדיר אותה, ומה עושים כשהחתימה מאבדת את העיצוב.',
      sections: [
        {
          h2: 'אאוטלוק החדש לחלונות ואאוטלוק בדפדפן',
          paragraphs: [
            'אאוטלוק החדש ואאוטלוק בדפדפן חולקים את אותו מאגר חתימות, ולכן הגדרה במקום אחד חלה אוטומטית גם על השני. החתימה נשמרת בתיבת הדואר ב‑Microsoft 365 ולא במחשב עצמו.'
          ],
          steps: [
            'פותחים הגדרות דרך סמל גלגל השיניים בפינה העליונה.',
            'נכנסים ל‑Mail ואז ל‑Compose and reply.',
            'תחת Email signature נותנים שם לחתימה.',
            'מדביקים את החתימה בעורך. מעתיקים מהתצוגה המעוצבת ולא מקוד ה‑HTML, כדי שהעיצוב יישמר.',
            'בוחרים אם להחיל על הודעות חדשות, על תשובות והעברות, או על שניהם.',
            'לוחצים על שמירה.'
          ],
          note: 'עורך הווב מוחק חלק מהגדרות ה‑CSS. אם המבנה מתפרק, סביר שהחתימה מסתמכת על CSS שאאוטלוק מסיר — ראו את המדריך על כתיבת HTML לחתימות.'
        },
        {
          h2: 'אאוטלוק הקלאסי לחלונות',
          paragraphs: [
            'אאוטלוק הקלאסי שומר חתימות כקבצים בדיסק, בשלושה חלקים: קובץ ‎.htm‎, גיבוי טקסט ‎.txt‎, ותיקייה עם התמונות. מכיוון שהתמונות מקושרות מהתיקייה הזו, העתקה של קובץ ה‑htm בלבד למחשב אחר תיצור חתימה עם ריבועים שבורים במקום תמונות.'
          ],
          steps: [
            'נכנסים ל‑File, ואז Options, ואז Mail, ואז Signatures.',
            'לוחצים על New ונותנים שם לחתימה.',
            'מדביקים את החתימה המעוצבת בתיבת העריכה.',
            'מגדירים חתימת ברירת מחדל להודעות חדשות ולתשובות והעברות.',
            'לוחצים על OK.'
          ],
          note: 'קובצי החתימה נמצאים בנתיב ‎%APPDATA%\\Microsoft\\Signatures‎. הנחת קובץ htm מוכן יחד עם תיקיית התמונות התואמת מתקינה חתימה בלי הדבקה ידנית — וכך בדיוק עובדת הפצה המונית.'
        },
        {
          h2: 'אאוטלוק ל‑Mac',
          paragraphs: [
            'אאוטלוק ל‑Mac שומר חתימות מקומית בפרופיל האפליקציה. החתימות לא מסתנכרנות מגרסת חלונות, ולכן צריך להגדיר אותן בכל מחשב בנפרד.'
          ],
          steps: [
            'פותחים את אאוטלוק, ואז Settings, ואז Signatures.',
            'לוחצים על כפתור הפלוס להוספת חתימה.',
            'מדביקים את החתימה המעוצבת ונותנים לה שם.',
            'מגדירים אותה כברירת מחדל לחשבון תחת Choose default signature.'
          ]
        },
        {
          h2: 'אאוטלוק לאייפון ולאנדרואיד',
          paragraphs: [
            'אפליקציות המובייל תומכות רק בחתימת טקסט פשוט. אי אפשר להגדיר בהן חתימת HTML עם לוגו. תשובות שנכתבות מהנייד ישתמשו בגרסת הטקסט הזו, ולכן כדאי לשמור אותה קצרה — בדרך כלל שם, תפקיד וטלפון.',
            'אם הארגון צריך חתימת HTML אחידה גם במובייל, יש להחיל אותה בצד השרת באמצעות כלל תעבורה של Exchange, שמוסיף אותה להודעות ביציאה מהשרת.'
          ],
          steps: [
            'פותחים את האפליקציה ומקישים על סמל הפרופיל.',
            'מקישים על גלגל השיניים כדי לפתוח הגדרות.',
            'מקישים על Signature.',
            'מחליפים את טקסט ברירת המחדל ומאשרים.'
          ]
        },
        {
          h2: 'כשהחתימה מאבדת את העיצוב',
          paragraphs: [
            'כמעט כל מקרה של חתימה שבורה נובע משלוש סיבות. הראשונה, ההודעה נכתבת בטקסט רגיל ולא ב‑HTML — כדאי לבדוק בלשונית Format Text. השנייה, החתימה הועתקה מקוד המקור במקום מתצוגה מעוצבת, ולכן אאוטלוק מדביק את הקוד כטקסט גלוי. השלישית, העיצוב משתמש ב‑CSS מודרני כמו flexbox או grid, שמנוע הרינדור של Word שמאחורי אאוטלוק לחלונות לא תומך בו.',
            'המחולל מייצר קוד מבוסס טבלאות עם עיצוב inline בדיוק כדי למנוע את המקרה השלישי.'
          ]
        }
      ],
      faq: [
        {
          q: 'למה התמונה בחתימה לא מופיעה אצל הנמענים?',
          a: 'כמעט תמיד התמונה מקושרת מהדיסק המקומי במקום להיות מוטמעת או מאוחסנת ברשת. הנמענים לא יכולים לגשת לנתיב במחשב שלכם. צריך להטמיע את התמונה בחתימה או לאחסן אותה בכתובת ציבורית.'
        },
        {
          q: 'אפשר חתימות שונות להודעות חדשות ולתשובות?',
          a: 'כן. בכל גרסאות אאוטלוק אפשר להגדיר חתימה אחת להודעות חדשות וחתימה אחרת לתשובות והעברות. מקובל להשתמש בחתימה מלאה בהודעות חדשות ובחתימה מקוצרת בתשובות.'
        },
        {
          q: 'האם החתימה באאוטלוק מסתנכרנת בין המכשירים?',
          a: 'רק באאוטלוק החדש ובאאוטלוק בדפדפן, ששומרים את החתימה בתיבת הדואר. אאוטלוק הקלאסי לחלונות ואאוטלוק ל‑Mac שומרים חתימות מקומית, ולכן כל מחשב דורש הגדרה נפרדת.'
        },
        {
          q: 'איך מתקינים חתימה אוטומטית לכל העובדים בחברה?',
          a: 'אפשר להפיץ את קובצי החתימה לפרופיל של כל משתמש באמצעות סקריפט או Group Policy, או להחיל את החתימה בצד השרת עם כלל תעבורה של Exchange. ייצוא מרוכז של קובצי חתימה לכל עובד הופך את השיטה הראשונה למעשית.'
        }
      ]
    }
  },
  {
    slug: 'bulk-email-signatures-excel',
    updated: '2026-08-05',
    en: {
      title: 'Create Email Signatures for a Whole Team from an Excel File',
      description:
        'How to generate consistent, per-employee Outlook signatures in bulk from a spreadsheet of names, titles, and phone numbers — and deploy them across the company.',
      h1: 'Create email signatures for a whole team from Excel',
      intro:
        'Designing one signature is quick. Producing eighty of them, each with a different name, title, and direct line, and keeping the branding identical across all of them, is where it stops being a design task and becomes a data task. The reliable approach is to build the design once as a template and let a spreadsheet supply the variable fields.',
      sections: [
        {
          h2: 'Prepare the spreadsheet',
          paragraphs: [
            'One row per employee, one column per field that changes between people. Everything that stays constant — logo, brand colours, disclaimer, social links — belongs in the template, not in the sheet. Keep the header row exactly as the generator expects so columns map automatically.'
          ],
          steps: [
            'Add a header row with the fields you want to vary: full name, job title, email, phone, mobile.',
            'Fill one row per employee. Leave a cell blank to omit that line from that person\'s signature.',
            'Check phone number formatting is consistent — signatures inherit the sheet exactly.',
            'Save as .xlsx or .csv.'
          ],
          note: 'Blank cells are respected rather than rendered as empty rows, so employees without a direct line simply get a signature without one.'
        },
        {
          h2: 'Build the template once',
          paragraphs: [
            'Set up the design with any single employee\'s details as a preview. Choose the layout, upload the logo, set brand colours, add social icons and any legal disclaimer. What you see in the preview is what every generated signature will look like, with only the spreadsheet fields swapped.',
            'Spend the time here rather than after generating. Changing the logo after export means regenerating the whole set, which is cheap, but re-deploying it is not.'
          ]
        },
        {
          h2: 'Generate and export',
          paragraphs: [
            'Upload the sheet in the Bulk panel and the generator produces one signature per row. The export is a ZIP containing, for each employee, the .htm file, the .txt plain-text fallback, and the image folder that Outlook expects — named to match the classic Outlook signature format.'
          ],
          steps: [
            'Open the Bulk panel and upload your file.',
            'Confirm the column mapping and review the row count.',
            'Export the ZIP.',
            'Spot-check two or three signatures before distributing.'
          ]
        },
        {
          h2: 'Deploy across the company',
          paragraphs: [
            'There are three practical routes, in ascending order of effort and control. The simplest is to send each employee their folder with instructions to copy it into %APPDATA%\\Microsoft\\Signatures. The second is a logon script or Group Policy that copies the right folder to each machine automatically, keyed on username. The third is an Exchange transport rule that appends the signature server-side, which guarantees consistency including on mobile, but appends the signature at the bottom of the whole thread rather than under each reply.',
            'Most organisations under a hundred people are well served by the first or second option.'
          ]
        }
      ],
      faq: [
        {
          q: 'How many signatures can I generate at once?',
          a: 'The generator processes the whole sheet in the browser, so the practical limit is your machine\'s memory rather than a fixed row count. Several hundred rows is routine.'
        },
        {
          q: 'What columns does the spreadsheet need?',
          a: 'At minimum a full name. Job title, email, phone, and mobile are optional — any column you leave out is simply omitted from the generated signatures.'
        },
        {
          q: 'Can each employee have a different photo?',
          a: 'The template applies one shared logo to every signature. Per-employee photos require generating in smaller groups, one per photo.'
        },
        {
          q: 'Is employee data uploaded to a server?',
          a: 'The spreadsheet is parsed in your browser. The rows are processed locally to produce the signature files.'
        }
      ]
    },
    he: {
      title: 'יצירת חתימות מייל לכל הארגון מקובץ אקסל',
      description:
        'איך מייצרים חתימות אאוטלוק אחידות לכל עובד בצורה מרוכזת מתוך גיליון עם שמות, תפקידים וטלפונים — ואיך מפיצים אותן בארגון.',
      h1: 'יצירת חתימות מייל לכל הארגון מקובץ אקסל',
      intro:
        'לעצב חתימה אחת זה מהיר. לייצר שמונים חתימות, כל אחת עם שם, תפקיד וטלפון ישיר אחרים, ולשמור על מיתוג זהה בכולן — שם זה מפסיק להיות משימת עיצוב והופך למשימת נתונים. הדרך היציבה היא לבנות את העיצוב פעם אחת כתבנית, ולתת לגיליון לספק את השדות המשתנים.',
      sections: [
        {
          h2: 'הכנת הגיליון',
          paragraphs: [
            'שורה אחת לכל עובד, עמודה אחת לכל שדה שמשתנה בין אנשים. כל מה שקבוע — לוגו, צבעי מותג, הבהרה משפטית, קישורים לרשתות — שייך לתבנית ולא לגיליון. שומרים על שורת כותרות בדיוק כפי שהמחולל מצפה, כדי שהעמודות ימופו אוטומטית.'
          ],
          steps: [
            'מוסיפים שורת כותרות עם השדות המשתנים: שם מלא, תפקיד, אימייל, טלפון, נייד.',
            'ממלאים שורה לכל עובד. תא ריק פשוט משמיט את השורה הזו מהחתימה של אותו אדם.',
            'בודקים שפורמט מספרי הטלפון אחיד — החתימות יורשות את הגיליון בדיוק כפי שהוא.',
            'שומרים כקובץ ‎.xlsx‎ או ‎.csv‎.'
          ],
          note: 'תאים ריקים מכובדים ולא מייצרים שורות ריקות, כך שעובד בלי טלפון ישיר פשוט מקבל חתימה בלעדיו.'
        },
        {
          h2: 'בניית התבנית פעם אחת',
          paragraphs: [
            'מגדירים את העיצוב עם פרטים של עובד אחד כתצוגה מקדימה. בוחרים מבנה, מעלים לוגו, קובעים צבעי מותג, מוסיפים אייקונים של רשתות חברתיות והבהרה משפטית אם צריך. מה שרואים בתצוגה המקדימה הוא בדיוק איך תיראה כל חתימה שתיווצר, כשרק שדות הגיליון מתחלפים.',
            'כדאי להשקיע כאן ולא אחרי הייצור. שינוי הלוגו אחרי הייצוא מחייב ייצור מחדש של כל הסט — וזה זול, אבל ההפצה מחדש כבר לא.'
          ]
        },
        {
          h2: 'ייצור וייצוא',
          paragraphs: [
            'מעלים את הגיליון בפאנל ההפצה המרוכזת והמחולל מייצר חתימה לכל שורה. הייצוא הוא קובץ ZIP שמכיל לכל עובד את קובץ ה‑htm, את גיבוי הטקסט, ואת תיקיית התמונות שאאוטלוק מצפה לה — בשמות שתואמים לפורמט החתימות של אאוטלוק הקלאסי.'
          ],
          steps: [
            'פותחים את פאנל ההפצה המרוכזת ומעלים את הקובץ.',
            'מאשרים את מיפוי העמודות ובודקים את מספר השורות.',
            'מייצאים את קובץ ה‑ZIP.',
            'בודקים שתיים־שלוש חתימות לדוגמה לפני ההפצה.'
          ]
        },
        {
          h2: 'הפצה בארגון',
          paragraphs: [
            'יש שלוש דרכים מעשיות, לפי סדר עולה של מאמץ ושליטה. הפשוטה היא לשלוח לכל עובד את התיקייה שלו עם הנחיה להעתיק אותה אל ‎%APPDATA%\\Microsoft\\Signatures‎. השנייה היא סקריפט התחברות או Group Policy שמעתיק את התיקייה הנכונה לכל מחשב אוטומטית לפי שם המשתמש. השלישית היא כלל תעבורה של Exchange שמוסיף את החתימה בצד השרת, מה שמבטיח אחידות כולל במובייל, אבל מוסיף את החתימה בתחתית כל השרשור ולא מתחת לכל תשובה.',
            'לרוב הארגונים עד מאה עובדים, האפשרות הראשונה או השנייה מספיקה בהחלט.'
          ]
        }
      ],
      faq: [
        {
          q: 'כמה חתימות אפשר לייצר בבת אחת?',
          a: 'המחולל מעבד את כל הגיליון בדפדפן, ולכן המגבלה המעשית היא הזיכרון של המחשב ולא מספר שורות קבוע. כמה מאות שורות זה שגרתי.'
        },
        {
          q: 'אילו עמודות צריכות להיות בגיליון?',
          a: 'לכל הפחות שם מלא. תפקיד, אימייל, טלפון ונייד הם רשות — כל עמודה שתשמיטו פשוט לא תופיע בחתימות.'
        },
        {
          q: 'אפשר תמונה שונה לכל עובד?',
          a: 'התבנית מחילה לוגו משותף אחד על כל החתימות. תמונות פרטניות לכל עובד מחייבות ייצור בקבוצות קטנות, אחת לכל תמונה.'
        },
        {
          q: 'האם נתוני העובדים נשלחים לשרת?',
          a: 'הגיליון מנותח בדפדפן שלכם. השורות מעובדות מקומית כדי לייצר את קובצי החתימה.'
        }
      ]
    }
  },
  {
    slug: 'html-email-signature-best-practices',
    updated: '2026-08-05',
    en: {
      title: 'HTML Email Signature Best Practices That Survive Outlook',
      description:
        'Why email signatures break in Outlook and the markup rules that keep them intact: tables over flexbox, inline styles, hosted images, and accessible fallbacks.',
      h1: 'HTML email signature best practices',
      intro:
        'Email clients are roughly fifteen years behind browsers, and Outlook for Windows is the furthest behind of all because it renders HTML with Microsoft Word rather than a browser engine. A signature that looks perfect in a browser preview can collapse entirely in the place it actually matters. These are the rules that hold up.',
      sections: [
        {
          h2: 'Lay out with tables, not flexbox or grid',
          paragraphs: [
            'Word\'s rendering engine has no support for flexbox, grid, float in any reliable form, or position. Nested tables with fixed pixel widths are the only layout primitive that renders consistently across Outlook, Gmail, Apple Mail, and the mobile clients.',
            'This feels archaic and it is, but it is the difference between a signature that holds its shape and one that becomes a vertical stack of misaligned text.'
          ]
        },
        {
          h2: 'Put every style inline',
          paragraphs: [
            'Gmail strips <style> blocks entirely. Outlook on the web rewrites class names. Any styling that lives in a stylesheet or a <style> element will be discarded somewhere in the chain, so every rule has to sit in a style attribute on the element it applies to.',
            'Set a font-family on each text element rather than relying on inheritance, because some clients reset fonts at the container boundary.'
          ]
        },
        {
          h2: 'Keep images hosted, sized, and optional',
          paragraphs: [
            'Reference images by absolute public URL, never by a local file path — a path on your disk is unreachable for everyone else and produces the classic broken-image square. Set explicit width and height attributes so the layout does not reflow while images load, and so blocked images still occupy the right space.',
            'Assume images will be blocked by default, because in many corporate clients they are. Write meaningful alt text and never put essential information such as a phone number inside an image, where it is invisible to blocked-image users, screen readers, and text search.'
          ]
        },
        {
          h2: 'Constrain the width and test on mobile',
          paragraphs: [
            'Keep the total signature width at or under 600 pixels. Wider signatures force horizontal scrolling on phones, where more than half of email is now read. Media queries are unreliable in this context, so design something that works at a fixed narrow width rather than something responsive.'
          ]
        },
        {
          h2: 'Restrain the content',
          paragraphs: [
            'A signature carries name, title, company, one or two contact methods, and optionally a logo and a small set of social icons. Every additional line reduces the chance any of it is read, and long legal disclaimers push the actual content out of the preview pane.',
            'Use real text for contact details rather than images. It is selectable, searchable, screen-reader accessible, and it survives image blocking.'
          ]
        }
      ],
      faq: [
        {
          q: 'Why does my signature look fine in Gmail but broken in Outlook?',
          a: 'Outlook for Windows renders HTML with the Word engine, which ignores flexbox, grid, and most positioning. Gmail uses a browser engine and is far more forgiving. Rebuilding the layout with nested tables and inline styles resolves it.'
        },
        {
          q: 'Should I embed images or link to them?',
          a: 'Link to images at a public HTTPS URL for web and new Outlook. Classic Outlook for Windows uses a local image folder alongside the .htm file, which is why the export includes both.'
        },
        {
          q: 'What is the ideal email signature size?',
          a: 'Under 600 pixels wide and under about 100KB in total. Larger signatures risk Gmail clipping the message and slow loading on mobile connections.'
        },
        {
          q: 'Do I need a plain text version of my signature?',
          a: 'Yes. Outlook pairs each HTML signature with a .txt fallback used when a message is composed in plain text. Without it, plain text messages get no signature at all.'
        }
      ]
    },
    he: {
      title: 'כללי כתיבת HTML לחתימות מייל שעובדות באאוטלוק',
      description:
        'למה חתימות מייל נשברות באאוטלוק ואילו כללי קוד שומרים עליהן: טבלאות במקום flexbox, עיצוב inline, תמונות מאוחסנות וחלופות נגישות.',
      h1: 'כללי כתיבת HTML לחתימות מייל',
      intro:
        'תוכנות דואר מפגרות אחרי הדפדפנים בערך בחמש־עשרה שנה, ואאוטלוק לחלונות מפגר מכולן כי הוא מרנדר HTML באמצעות Word ולא במנוע דפדפן. חתימה שנראית מושלמת בתצוגה בדפדפן עלולה להתפרק לגמרי בדיוק במקום שבו זה חשוב. אלה הכללים שמחזיקים.',
      sections: [
        {
          h2: 'בונים מבנה עם טבלאות, לא עם flexbox או grid',
          paragraphs: [
            'מנוע הרינדור של Word לא תומך ב‑flexbox, ב‑grid, ב‑float בצורה אמינה כלשהי, או ב‑position. טבלאות מקוננות עם רוחב קבוע בפיקסלים הן אמצעי הפריסה היחיד שמרונדר באופן עקבי באאוטלוק, בג׳ימייל, ב‑Apple Mail ובלקוחות המובייל.',
            'זה נשמע ארכאי וזה באמת כך, אבל זה ההבדל בין חתימה ששומרת על הצורה שלה לבין ערימה אנכית של טקסט לא מיושר.'
          ]
        },
        {
          h2: 'כל העיצוב בתוך התגית',
          paragraphs: [
            'ג׳ימייל מוחק בלוקים של ‎<style>‎ לחלוטין. אאוטלוק בדפדפן משכתב שמות מחלקות. כל עיצוב שיושב בגיליון סגנונות או באלמנט ‎<style>‎ יימחק באיזשהו שלב בשרשרת, ולכן כל כלל חייב לשבת במאפיין style על האלמנט שהוא חל עליו.',
            'כדאי להגדיר font-family על כל אלמנט טקסט ולא להסתמך על הורשה, כי חלק מהלקוחות מאפסים גופנים בגבול המכולה.'
          ]
        },
        {
          h2: 'תמונות מאוחסנות, עם מידות, ולא הכרחיות',
          paragraphs: [
            'מקשרים לתמונות בכתובת ציבורית מלאה, לעולם לא בנתיב מקומי — נתיב בדיסק שלכם לא נגיש לאף אחד אחר ומייצר את ריבוע התמונה השבורה המוכר. מגדירים מאפייני width ו‑height מפורשים כדי שהמבנה לא יזוז בזמן טעינת התמונות, וכדי שתמונות חסומות עדיין יתפסו את המקום הנכון.',
            'צריך להניח שתמונות ייחסמו כברירת מחדל, כי בהרבה לקוחות ארגוניים זה המצב. כותבים טקסט חלופי משמעותי, ולעולם לא שמים מידע חיוני כמו מספר טלפון בתוך תמונה, שם הוא בלתי נראה למשתמשים עם תמונות חסומות, לקוראי מסך ולחיפוש טקסט.'
          ]
        },
        {
          h2: 'מגבילים את הרוחב ובודקים במובייל',
          paragraphs: [
            'שומרים על רוחב כולל של עד 600 פיקסלים. חתימות רחבות יותר גורמות לגלילה אופקית בטלפון, שם נקראים היום יותר מחצי מהמיילים. שאילתות מדיה לא אמינות בהקשר הזה, ולכן עדיף לעצב משהו שעובד ברוחב צר קבוע מאשר משהו רספונסיבי.'
          ]
        },
        {
          h2: 'מרסנים את התוכן',
          paragraphs: [
            'חתימה נושאת שם, תפקיד, חברה, אמצעי קשר אחד או שניים, ואופציונלית לוגו וכמה אייקונים של רשתות חברתיות. כל שורה נוספת מקטינה את הסיכוי שמשהו מזה ייקרא, והבהרות משפטיות ארוכות דוחפות את התוכן האמיתי אל מחוץ לחלון התצוגה המקדימה.',
            'משתמשים בטקסט אמיתי לפרטי קשר ולא בתמונות. טקסט ניתן לסימון, לחיפוש, נגיש לקוראי מסך, ושורד חסימת תמונות.'
          ]
        }
      ],
      faq: [
        {
          q: 'למה החתימה נראית תקין בג׳ימייל ושבורה באאוטלוק?',
          a: 'אאוטלוק לחלונות מרנדר HTML במנוע של Word, שמתעלם מ‑flexbox, מ‑grid ומרוב הגדרות המיקום. ג׳ימייל משתמש במנוע דפדפן וסלחני הרבה יותר. בנייה מחדש של המבנה עם טבלאות מקוננות ועיצוב inline פותרת את זה.'
        },
        {
          q: 'להטמיע תמונות או לקשר אליהן?',
          a: 'מקשרים לתמונות בכתובת HTTPS ציבורית עבור הווב ואאוטלוק החדש. אאוטלוק הקלאסי לחלונות משתמש בתיקיית תמונות מקומית לצד קובץ ה‑htm, ולכן הייצוא כולל את שניהם.'
        },
        {
          q: 'מה הגודל האידיאלי לחתימת מייל?',
          a: 'עד 600 פיקסלים רוחב ועד כ‑100KB בסך הכול. חתימות גדולות יותר עלולות לגרום לג׳ימייל לקטוע את ההודעה ולהיטען לאט בחיבור סלולרי.'
        },
        {
          q: 'צריך גם גרסת טקסט פשוט לחתימה?',
          a: 'כן. אאוטלוק מצמיד לכל חתימת HTML קובץ ‎.txt‎ חלופי שמשמש כשההודעה נכתבת בטקסט רגיל. בלעדיו, הודעות טקסט פשוט לא יקבלו חתימה כלל.'
        }
      ]
    }
  }
]
