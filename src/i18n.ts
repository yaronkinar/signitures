export type AppLanguage = 'en' | 'he'

export type SignatureStrings = {
  phoneLabel: string
  emailLabel: string
  websiteLabel: string
  fullNamePlaceholder: string
  jobTitlePlaceholder: string
  companyLogoPlaceholder: string
  companyLogoAlt: string
}

const translations = {
  en: {
    pageTitle: 'Outlook Signature Generator',
    pageHeading: 'Outlook Signature Generator',
    pageLead:
      'Fill in your details and generate copy-ready HTML for Outlook. Expand each section as needed.',
    contactDetails: 'Contact details',
    language: 'Language',
    langEnglish: 'English',
    langHebrew: 'Hebrew (עברית)',
    fullName: 'Full name',
    jobTitle: 'Job title',
    company: 'Company',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    fullNamePlaceholder: 'Jane Doe',
    jobTitlePlaceholder: 'Sales Manager',
    companyPlaceholder: 'Acme Ltd',
    phonePlaceholder: '+1 555 123 4567',
    emailPlaceholder: 'jane@acme.com',
    websitePlaceholder: 'https://acme.com',
    logoBanner: 'Logo & banner',
    logoBannerHint: 'Use a URL or upload a local image file.',
    logoUrl: 'Logo URL',
    logoFile: 'Logo file',
    bannerUrl: 'Banner URL',
    bannerFile: 'Banner file',
    bannerLink: 'Banner link',
    urlPlaceholder: 'https://...',
    socialMedia: 'Social media',
    socialMediaHint:
      'Add profile URLs for networks you use. Leave icon fields empty for built-in brand icons.',
    profileUrl: 'Profile URL',
    iconUrl: 'Icon URL',
    iconFile: 'Icon file',
    optionalPlaceholder: 'Optional',
    layoutTypography: 'Layout & typography',
    fontFamily: 'Font family',
    nameFontSize: 'Name size (px)',
    titleFontSize: 'Title size (px)',
    bodyFontSize: 'Body size (px)',
    lineSpacing: 'Line spacing',
    signatureWidth: 'Width (px)',
    signatureHeight: 'Height (px)',
    textColumnWidth: 'Text column (px)',
    logoMaxWidth: 'Logo max width (px)',
    positionAlignment: 'Position & alignment',
    mainTextAlign: 'Main text align',
    nameTitleAlign: 'Name/title align',
    logoAlign: 'Logo align',
    verticalAlign: 'Vertical align',
    textOffsetX: 'Text offset X',
    textOffsetY: 'Text offset Y',
    logoOffsetX: 'Logo offset X',
    logoOffsetY: 'Logo offset Y',
    dividerThickness: 'Divider thickness',
    socialIconGap: 'Social icon gap',
    alignLeft: 'Left',
    alignCenter: 'Center',
    alignRight: 'Right',
    alignTop: 'Top',
    alignMiddle: 'Middle',
    alignBottom: 'Bottom',
    colors: 'Colors',
    accent: 'Accent',
    primaryText: 'Primary text',
    secondaryText: 'Secondary text',
    divider: 'Divider',
    links: 'Links',
    background: 'Background',
    extraLinkedImages: 'Extra linked images',
    extraLinkedImagesHint: 'Optional icons or buttons with their own link targets.',
    addLinkedImage: 'Add linked image',
    generateSignature: 'Generate signature',
    copyHtml: 'Copy HTML',
    downloadHtml: 'Download .html',
    installOutlook: 'Install to Outlook',
    newOutlookSetup: 'New Outlook setup',
    preview: 'Preview',
    generatedHtml: 'Generated HTML',
    imageUrl: 'Image URL',
    linkUrl: 'Link URL',
    altText: 'Alt text',
    imageFile: 'Image file',
    remove: 'Remove',
    linkedImageAlt: 'Linked image',
    composeReplySettings: 'Compose and reply settings',
    signatureFolderPrefix: 'Classic Outlook signatures folder: ',
    signatureFolderLink: 'open folder',
    signatureFolderSuffix: '.',
    newOutlookSetupPrefix: 'New Outlook setup: open ',
    newOutlookSetupSuffix: ', paste into signature editor, then save.',
    alertGenerateFailed: 'Could not generate social icons. Please try again.',
    alertOutlookInstallSuccess:
      'Installers downloaded: install-outlook-signature.ps1 and run-install-outlook-signature.bat. Double-click the .bat for easiest install, or run the .ps1 directly.',
    alertOutlookInstallFailed: 'Could not prepare Outlook installer. Please generate the signature first.',
    alertNewOutlookFailed: 'Could not prepare New Outlook setup. Please generate the signature first.',
    alertNewOutlookCopiedOpened:
      'Signature copied and New Outlook settings opened. Paste in the signature editor and click Save.',
    alertNewOutlookCopied:
      'Signature copied. Please open New Outlook settings (Compose and reply), paste into signature editor, and click Save.',
    alertNewOutlookOpenedNoCopy:
      'New Outlook settings opened, but clipboard copy was blocked. Copy from "Generated HTML", paste into signature editor, and click Save.',
    alertNewOutlookManual:
      'Could not auto-open settings or copy automatically. Open New Outlook > Settings > Mail > Compose and reply, paste from "Generated HTML", and click Save.'
  },
  he: {
    pageTitle: 'מחולל חתימות Outlook',
    pageHeading: 'מחולל חתימות Outlook',
    pageLead: 'מלאו את הפרטים ויצרו HTML מוכן להעתקה ל-Outlook. הרחיבו כל מקטע לפי הצורך.',
    contactDetails: 'פרטי קשר',
    language: 'שפה',
    langEnglish: 'English',
    langHebrew: 'עברית',
    fullName: 'שם מלא',
    jobTitle: 'תפקיד',
    company: 'חברה',
    phone: 'טלפון',
    email: 'דוא"ל',
    website: 'אתר',
    fullNamePlaceholder: 'ישראל ישראלי',
    jobTitlePlaceholder: 'מנהל מכירות',
    companyPlaceholder: 'חברה בע"מ',
    phonePlaceholder: '050-1234567',
    emailPlaceholder: 'name@company.co.il',
    websitePlaceholder: 'https://company.co.il',
    logoBanner: 'לוגו ובאנר',
    logoBannerHint: 'השתמשו בכתובת URL או העלו קובץ תמונה מהמחשב.',
    logoUrl: 'כתובת לוגו',
    logoFile: 'קובץ לוגו',
    bannerUrl: 'כתובת באנר',
    bannerFile: 'קובץ באנר',
    bannerLink: 'קישור באנר',
    urlPlaceholder: 'https://...',
    socialMedia: 'רשתות חברתיות',
    socialMediaHint: 'הוסיפו כתובות פרופיל לרשתות שבהן אתם משתמשים. השאירו אייקון ריק לשימוש באייקון מובנה.',
    profileUrl: 'כתובת פרופיל',
    iconUrl: 'כתובת אייקון',
    iconFile: 'קובץ אייקון',
    optionalPlaceholder: 'אופציונלי',
    layoutTypography: 'פריסה וטיפוגרפיה',
    fontFamily: 'גופן',
    nameFontSize: 'גודל שם (px)',
    titleFontSize: 'גודל תפקיד (px)',
    bodyFontSize: 'גודל גוף (px)',
    lineSpacing: 'ריווח שורות',
    signatureWidth: 'רוחב (px)',
    signatureHeight: 'גובה (px)',
    textColumnWidth: 'רוחב עמודת טקסט (px)',
    logoMaxWidth: 'רוחב מקסימלי ללוגו (px)',
    positionAlignment: 'מיקום ויישור',
    mainTextAlign: 'יישור טקסט ראשי',
    nameTitleAlign: 'יישור שם/תפקיד',
    logoAlign: 'יישור לוגו',
    verticalAlign: 'יישור אנכי',
    textOffsetX: 'היסט טקסט X',
    textOffsetY: 'היסט טקסט Y',
    logoOffsetX: 'היסט לוגו X',
    logoOffsetY: 'היסט לוגו Y',
    dividerThickness: 'עובי מפריד',
    socialIconGap: 'ריווח אייקונים חברתיים',
    alignLeft: 'שמאל',
    alignCenter: 'מרכז',
    alignRight: 'ימין',
    alignTop: 'למעלה',
    alignMiddle: 'אמצע',
    alignBottom: 'למטה',
    colors: 'צבעים',
    accent: 'הדגשה',
    primaryText: 'טקסט ראשי',
    secondaryText: 'טקסט משני',
    divider: 'מפריד',
    links: 'קישורים',
    background: 'רקע',
    extraLinkedImages: 'תמונות מקושרות נוספות',
    extraLinkedImagesHint: 'אייקונים או כפתורים אופציונליים עם יעדי קישור משלהם.',
    addLinkedImage: 'הוספת תמונה מקושרת',
    generateSignature: 'יצירת חתימה',
    copyHtml: 'העתקת HTML',
    downloadHtml: 'הורדת .html',
    installOutlook: 'התקנה ב-Outlook',
    newOutlookSetup: 'הגדרת Outlook החדש',
    preview: 'תצוגה מקדימה',
    generatedHtml: 'HTML שנוצר',
    imageUrl: 'כתובת תמונה',
    linkUrl: 'כתובת קישור',
    altText: 'טקסט חלופי',
    imageFile: 'קובץ תמונה',
    remove: 'הסרה',
    linkedImageAlt: 'תמונה מקושרת',
    composeReplySettings: 'הגדרות כתיבה ומענה',
    signatureFolderPrefix: 'תיקיית חתימות Outlook הקלאסי: ',
    signatureFolderLink: 'פתיחת התיקייה',
    signatureFolderSuffix: '.',
    newOutlookSetupPrefix: 'הגדרת Outlook החדש: פתחו ',
    newOutlookSetupSuffix: ', הדביקו בעורך החתימה ושמרו.',
    alertGenerateFailed: 'לא ניתן ליצור אייקונים חברתיים. נסו שוב.',
    alertOutlookInstallSuccess:
      'קבצי ההתקנה הורדו: install-outlook-signature.ps1 ו-run-install-outlook-signature.bat. לחצו פעמיים על קובץ ה-.bat להתקנה הקלה, או הריצו את קובץ ה-.ps1.',
    alertOutlookInstallFailed: 'לא ניתן להכין את מתקין Outlook. יש ליצור חתימה תחילה.',
    alertNewOutlookFailed: 'לא ניתן להכין את הגדרת Outlook החדש. יש ליצור חתימה תחילה.',
    alertNewOutlookCopiedOpened:
      'החתימה הועתקה והגדרות Outlook החדש נפתחו. הדביקו בעורך החתימה ולחצו שמור.',
    alertNewOutlookCopied:
      'החתימה הועתקה. פתחו את הגדרות Outlook החדש (כתיבה ומענה), הדביקו בעורך החתימה ולחצו שמור.',
    alertNewOutlookOpenedNoCopy:
      'הגדרות Outlook החדש נפתחו, אך ההעתקה ללוח נחסמה. העתיקו מ-"HTML שנוצר", הדביקו בעורך החתימה ולחצו שמור.',
    alertNewOutlookManual:
      'לא ניתן לפתוח הגדרות או להעתיק אוטומטית. פתחו Outlook החדש > הגדרות > דואר > כתיבה ומענה, והדביקו מ-"HTML שנוצר".'
  }
} as const

export type I18nKey = keyof (typeof translations)['en']

export const t = (lang: AppLanguage, key: I18nKey): string => translations[lang][key]

export const signatureStrings: Record<AppLanguage, SignatureStrings> = {
  en: {
    phoneLabel: 'Mobile:',
    emailLabel: 'Email:',
    websiteLabel: 'Website:',
    fullNamePlaceholder: 'Full name',
    jobTitlePlaceholder: 'Job title',
    companyLogoPlaceholder: 'Company logo',
    companyLogoAlt: 'Company logo'
  },
  he: {
    phoneLabel: 'נייד:',
    emailLabel: 'דוא"ל:',
    websiteLabel: 'אתר:',
    fullNamePlaceholder: 'שם מלא',
    jobTitlePlaceholder: 'תפקיד',
    companyLogoPlaceholder: 'לוגו חברה',
    companyLogoAlt: 'לוגו חברה'
  }
}

const NEW_OUTLOOK_SIGNATURE_SETTINGS_URL =
  'https://outlook.office.com/mail/options/mail/layout/EmailSignature'

export const OUTLOOK_SIGNATURES_FOLDER_PATH = '%APPDATA%\\Microsoft\\Signatures'

export const signatureFolderStatusHtml = (lang: AppLanguage): string =>
  `${t(lang, 'signatureFolderPrefix')}<a href="#" class="open-signatures-folder">${t(lang, 'signatureFolderLink')}</a> <span dir="ltr">(${OUTLOOK_SIGNATURES_FOLDER_PATH})</span>${t(lang, 'signatureFolderSuffix')}`

export const newOutlookStatusHtml = (lang: AppLanguage): string =>
  `${t(lang, 'newOutlookSetupPrefix')}<a href="${NEW_OUTLOOK_SIGNATURE_SETTINGS_URL}" target="_blank" rel="noopener noreferrer">${t(lang, 'composeReplySettings')}</a>${t(lang, 'newOutlookSetupSuffix')}`

export const outlookHelpStatusHtml = (lang: AppLanguage): string =>
  `${signatureFolderStatusHtml(lang)}<br>${newOutlookStatusHtml(lang)}`

export const applyUiLanguage = (lang: AppLanguage): void => {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
  document.title = t(lang, 'pageTitle')

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n as I18nKey | undefined
    if (!key) return
    element.textContent = t(lang, key)
  })

  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((input) => {
    const key = input.dataset.i18nPlaceholder as I18nKey | undefined
    if (key) input.placeholder = t(lang, key)
  })

  const langSelect = document.getElementById('signatureLanguage') as HTMLSelectElement | null
  if (langSelect) {
    const enOption = langSelect.querySelector<HTMLOptionElement>('option[value="en"]')
    const heOption = langSelect.querySelector<HTMLOptionElement>('option[value="he"]')
    if (enOption) enOption.textContent = t(lang, 'langEnglish')
    if (heOption) heOption.textContent = t(lang, 'langHebrew')
  }
}

export const localizeLinkImageRow = (row: HTMLElement, lang: AppLanguage): void => {
  const labelKeys: Array<{ selector: string; key: I18nKey }> = [
    { selector: '.link-image-url-label', key: 'imageUrl' },
    { selector: '.link-image-href-label', key: 'linkUrl' },
    { selector: '.link-image-alt-label', key: 'altText' },
    { selector: '.link-image-file-label', key: 'imageFile' }
  ]

  for (const { selector, key } of labelKeys) {
    const label = row.querySelector<HTMLElement>(selector)
    if (label) label.textContent = t(lang, key)
  }

  const urlInputs = row.querySelectorAll<HTMLInputElement>('.link-image-url, .link-image-href')
  urlInputs.forEach((input) => {
    input.placeholder = t(lang, 'urlPlaceholder')
  })

  const altInput = row.querySelector<HTMLInputElement>('.link-image-alt')
  if (altInput && !altInput.value.trim()) {
    altInput.placeholder = t(lang, 'linkedImageAlt')
  }

  const removeButton = row.querySelector<HTMLButtonElement>('.remove-link-image')
  if (removeButton) removeButton.textContent = t(lang, 'remove')
}
