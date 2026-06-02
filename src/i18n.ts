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
    formSaving: 'Saving…',
    formSaved: 'Saved locally',
    formSaveFailed: 'Could not save. Browser storage may be full.',
    undo: 'Undo',
    redo: 'Redo',
    undoShortcut: 'Undo (Ctrl+Z)',
    redoShortcut: 'Redo (Ctrl+Shift+Z)',
    resetForm: 'Reset to defaults',
    resetFormConfirm: 'Reset all fields to the default template? Your saved draft will be cleared.',
    saveAs: 'Save',
    saveAsPrompt: 'Name for this signature',
    saveAsOverwriteConfirm: 'A saved signature with this name already exists. Replace it?',
    saveAsSuccess: 'Saved as "{name}".',
    saveAsCloudSuccess: 'Saved to cloud as "{name}".',
    saveAsCloudTooLarge: 'Signature is too large for cloud save (max 10 MB).',
    saveAsFailedStorage: 'Could not save. Browser storage may be full.',
    saveAsFailedTooMany: 'Too many saved signatures. Delete one before saving another.',
    savedLoadPlaceholder: 'Open saved…',
    savedLoadSuccess: 'Saved signature loaded.',
    savedLoadFailed: 'Could not load the saved signature.',
    savedDelete: 'Delete',
    savedDeleteConfirm: 'Delete this saved signature?',
    savedDeleteSuccess: 'Saved signature deleted.',
    cloudStorageHint: 'Saved to Vercel Blob (this browser).',
    exportParams: 'Export settings',
    exportStyle: 'Export style only',
    importParams: 'Import settings',
    paramsExportSuccess: 'Settings exported.',
    paramsStyleExportSuccess: 'Style exported.',
    paramsImportSuccess: 'Settings imported.',
    paramsStyleImportSuccess: 'Style applied. Your contact details were kept.',
    paramsImportFailed: 'Could not import settings. Check that the file is valid JSON.',
    aiDesignAssistant: 'AI design assistant',
    aiDesignLead:
      'Describe the look you want — style, colors, language, tone — and the agent will tune layout and colors. Your contact details are kept unless you ask to change them.',
    aiPresetLabel: 'Quick prompts (from current design)',
    aiPresetPlaceholder: 'Choose a preset…',
    aiBriefPlaceholder:
      'e.g. Minimal Hebrew signature for a law firm, navy accent, logo on the right, professional',
    aiApiKeyLabel: 'OpenAI API key',
    aiApiKeyPlaceholder: 'sk-... (optional — uses Vercel server key when deployed)',
    aiApiKeyUsingEnv: 'Using API key from .env — leave empty to keep using it.',
    aiApiKeyUsingServer: 'Using server API key (Vercel) — leave empty unless overriding.',
    aiModeRefine: 'Refine current signature',
    aiModeCreate: 'Create brand new signature',
    aiCreateLead:
      'Describe a new signature from scratch — industry, style, language, colors. AI will design layout and colors. Include your name and role in the brief, or check "Keep my contact details".',
    aiKeepContact: 'Keep my contact details',
    aiCreatePresetLabel: 'Starter ideas for a new signature',
    aiCreateBriefPlaceholder:
      'e.g. New Hebrew signature for a fintech startup — modern, teal accent, minimal, product manager',
    aiDesignButton: 'Refine with AI',
    aiCreateNewButton: 'Create new with AI',
    aiCreateSuccess: 'New signature created.',
    aiDesignWorking: 'Designing your signature…',
    aiDesignSuccess: 'Design applied.',
    aiDesignMissingBrief: 'Describe the signature style you want first.',
    aiDesignMissingApiKey:
      'Add an OpenAI API key above, set VITE_OPENAI_API_KEY in .env for local dev, or OPENAI_API_KEY on Vercel.',
    aiDesignFailed: 'AI design failed. Check your API key and try again.',
    aiSignaturePreview: 'Your signature preview',
    contactDetails: 'Contact details',
    language: 'Language',
    langEnglish: 'English',
    langHebrew: 'Hebrew (עברית)',
    fullName: 'Full name',
    outlookSignatureName: 'Outlook signature name (English)',
    outlookSignatureNamePlaceholder: 'Hila Melinovsky',
    outlookSignatureNameHint:
      'Used as the name in classic Outlook’s signature list. Use English/Latin letters when the display name is Hebrew.',
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
    logoPlacement: 'Logo placement',
    logoPlacementHint:
      'Choose which side of the signature the logo sits on, then fine-tune horizontal and vertical position. Watch the preview update live.',
    logoPlacementHorizontal: 'Horizontal placement',
    logoPlacementVertical: 'Vertical placement',
    logoSide: 'Logo side',
    logoHorizontalPlacement: 'Horizontal position',
    logoHorizontalPlacementHint: 'Negative moves toward the outer edge; positive moves toward the text divider.',
    logoVerticalPlacement: 'Vertical position',
    logoVerticalPlacementHint: 'Negative moves up; positive moves down.',
    logoSideLeft: 'Left',
    logoSideRight: 'Right',
    bannerUrl: 'Banner URL',
    bannerFile: 'Banner file',
    bannerLink: 'Banner link',
    urlPlaceholder: 'https://...',
    socialMedia: 'Social media',
    socialMediaHint:
      'Add profile URLs for networks you use. Pick a built-in icon style or supply your own icon URL or file.',
    socialIconVariantLabel: 'Icon style',
    socialIconVariantHint: 'Choose a built-in icon style for this network.',
    socialIconVariantExpandHint:
      'Expand each network below. The icon style picker is inside every network section.',
    socialIconVariantLoading: 'Loading icon previews…',
    socialIconVariantLoadFailed:
      'Icon previews could not load. Refresh the page or try another browser.',
    socialIconVariantCustomActive:
      'A custom icon URL or file is in use. Clear it to choose a built-in style again.',
    socialIconVariantBrand: 'Brand color',
    socialIconVariantMono: 'Monochrome',
    socialIconVariantWhite: 'White',
    socialIconVariantGradient: 'Gradient',
    socialIconVariantBadge: 'Badge',
    profileUrl: 'Profile URL',
    iconUrl: 'Icon URL',
    iconFile: 'Icon file',
    optionalPlaceholder: 'Optional',
    layoutTypography: 'Layout & typography',
    brandPreset: 'Brand preset',
    brandPresetPlaceholder: 'Apply a brand preset...',
    brandPresetHint:
      'Extracted from the SBA 2025 brand book: colors #4d4c4f, #dadee7, #a74e8d, #30bbed, #4c4c4e, #33ccff, #88236f; fonts Rubik and Cairo.',
    brandColors: 'Extracted brand colors',
    fontFamily: 'Font family',
    outlookFontHint:
      'Install to Outlook automatically downloads and installs Rubik or Cairo on Windows, then sets up your signature. Restart Outlook after running the installer. Recipients may still see a fallback font unless they have it installed too.',
    installWindowsFont: 'Install {font} only',
    downloadFontFromGoogle: 'Download from Google Fonts',
    alertWindowsFontInstallSuccess:
      'Downloaded the font installer. Double-click it to install on Windows, then restart Outlook and reinstall your signature.',
    alertWindowsFontInstallFailed: 'Could not prepare the font installer.',
    batWindowsFontDownloading: 'Downloading font files…',
    batWindowsFontInstalling: 'Installing fonts on Windows…',
    batWindowsFontMissingFiles: 'No font files found in the downloaded package.',
    batWindowsFontFolderFailed: 'Could not open the Windows Fonts folder.',
    batWindowsFontSuccess: 'Font installed on Windows.',
    batWindowsFontRestartOutlook: 'Restart Outlook, then reinstall your signature.',
    batWindowsFontDone: 'Font installation finished.',
    batWindowsFontFailed: 'Font installation failed. Try downloading from Google Fonts manually.',
    batWindowsFontInstallSkipped:
      'Could not install the font automatically — signature will still be installed. Install the font manually if needed.',
    nameFontWeight: 'Name weight',
    titleFontWeight: 'Title weight',
    bodyFontWeight: 'Body weight',
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
    emailAlign: 'Position in email',
    logoAlign: 'Logo align',
    verticalAlign: 'Vertical align',
    textOffsetX: 'Text horizontal shift',
    textOffsetY: 'Text vertical shift',
    logoOffsetX: 'Logo horizontal shift',
    logoOffsetY: 'Logo vertical shift',
    dividerThickness: 'Divider thickness',
    socialIconGap: 'Social icon gap',
    alignLeft: 'Left',
    alignCenter: 'Center',
    alignRight: 'Right',
    alignTop: 'Top',
    alignMiddle: 'Middle',
    alignBottom: 'Bottom',
    colors: 'Colors',
    elementColorsHint: 'Set a color for each part of the signature.',
    accent: 'Accent',
    primaryText: 'Primary text',
    secondaryText: 'Secondary text',
    contactLabels: 'Contact labels',
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
    installGuide: 'How to install in Outlook',
    installGuideLead:
      'Follow these steps to install your signature in classic Outlook desktop.',
    installGuideAlt: 'Animated guide: generate signature, install to Outlook, run the installer, restart Outlook',
    newOutlookSetup: 'New Outlook setup',
    preview: 'Preview',
    livePreviewHint: 'Actual size in an Outlook message body. Updates as you edit.',
    outlookPreviewTitle: 'New message',
    outlookPreviewTo: 'To',
    outlookPreviewPlaceholder: 'Type your message here…',
    styleSummary: 'Style summary',
    styleSummaryTypeScale: 'Type scale',
    styleSummaryDimensions: 'Canvas size',
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
    exportSignaturesZipLink: 'ZIP for IT',
    signatureFolderSuffix: '.',
    batSignaturesZipCreated: 'ZIP created on your Desktop:',
    batSignaturesZipFailed:
      'Could not create ZIP. Run Install to Outlook first, or check that the Signatures folder is not empty.',
    newOutlookSetupPrefix: 'New Outlook setup: open ',
    newOutlookSetupSuffix: ', paste into signature editor, then save.',
    alertGenerateFailed: 'Could not generate social icons. Please try again.',
    alertOutlookInstallSuccess:
      'Downloaded install-outlook-signature.bat. It installs the font on Windows and your signature in one step. Double-click the bat file, then restart Outlook. In Outlook, look for the English signature name you entered (or your email username if left blank).',
    alertOutlookInstallFailed: 'Could not prepare Outlook installer. Please generate the signature first.',
    batInstallerCorrupt: 'Installer script is corrupted.',
    batInstallComplete: 'Signature installation completed.',
    batInstallFailed: 'Installation failed.',
    batInstallSecurityHint:
      'If Windows shows a security warning, choose More info, then Run anyway.',
    batPsInstallSuccess: 'Signature installed successfully:',
    batPsSetDefault: 'Set as default for New/Reply where supported.',
    batPsRestartOutlook: 'If Outlook was open, restart Outlook to refresh signatures.',
    batPsClassicNote:
      'Note: works with classic Outlook desktop. New Outlook may ignore local signature files.',
    batPressEnterToClose: 'Press Enter to close',
    batFolderOpened: 'Signatures folder opened.',
    alertNewOutlookFailed: 'Could not prepare New Outlook setup. Please generate the signature first.',
    alertNewOutlookCopiedOpened:
      'Signature copied and New Outlook settings opened. Paste in the signature editor and click Save.',
    alertNewOutlookCopied:
      'Signature copied. Please open New Outlook settings (Compose and reply), paste into signature editor, and click Save.',
    alertNewOutlookOpenedNoCopy:
      'New Outlook settings opened, but clipboard copy was blocked. Copy from "Generated HTML", paste into signature editor, and click Save.',
    alertNewOutlookManual:
      'Could not auto-open settings or copy automatically. Open New Outlook > Settings > Mail > Compose and reply, paste from "Generated HTML", and click Save.',
    imageImport: 'Create from image',
    imageImportLead:
      'Upload a screenshot or PNG/JPG of an existing signature. AI will read the visible details, keep the colors, fill the form, and generate an editable HTML signature.',
    imageImportFile: 'Signature image',
    imageImportButton: 'Read image & create signature',
    imageImportWorking: 'Reading the image and creating the signature...',
    imageImportSuccess: 'Signature created from image.',
    imageImportFailed: 'Could not create a signature from the image.',
    imageImportTooLarge: 'Upload an image smaller than 5 MB.',
    bulkSignatures: 'Bulk signatures (Excel)',
    bulkSignaturesLead:
      'Upload a spreadsheet with one person per row. Each row gets an HTML signature file using your current design (logo, colors, layout).',
    bulkSignaturesColumns:
      'Columns: fullName (or name), jobTitle, company, phone, email, website — optional language (en/he). First row must be headers.',
    bulkDownloadTemplate: 'Download Excel template',
    bulkUploadExcel: 'Upload Excel (HTML ZIP)',
    bulkUploadExcelIt: 'Upload Excel → ZIP for IT',
    bulkItHint:
      'ZIP for IT uses Outlook Signatures layout (.htm, .txt, .rtf, and *_files per person). Send outlook-signatures-for-it.zip to IT. The “ZIP for IT” link under Install only exports signatures already on this PC.',
    bulkWorking: 'Generating signatures…',
    bulkItSuccessOne: 'Downloaded outlook-signatures-for-it.zip with 1 signature for IT.',
    bulkItSuccessMany: 'Downloaded outlook-signatures-for-it.zip with {count} signatures for IT.',
    bulkSuccessOne: 'Downloaded signatures.zip with 1 signature.',
    bulkSuccessMany: 'Downloaded signatures.zip with {count} signatures.',
    bulkFailed: 'Bulk export failed.',
    bulkUsesCurrentDesign: 'Uses the design settings from the form above (not AI-generated per row).',
    bulkErrorNoSheets: 'The file has no worksheets.',
    bulkErrorNoDataRows: 'Add a header row and at least one data row.',
    bulkErrorNoColumns: 'No recognized columns. Use the template or headers like fullName, email, phone.',
    bulkErrorNoValidRows: 'No rows with a name or email were found.',
    bulkErrorTooManyRows: 'Maximum 500 people per file.',
    bulkErrorUnknown: 'Could not read the spreadsheet.',
    appUpdateAvailable: 'A new version is available. Reload to get the latest changes.',
    appUpdateReload: 'Reload',
    appUpdateDismiss: 'Later'
  },
  he: {
    pageTitle: 'מחולל חתימות Outlook',
    pageHeading: 'מחולל חתימות Outlook',
    pageLead: 'מלאו את הפרטים ויצרו HTML מוכן להעתקה ל-Outlook. הרחיבו כל מקטע לפי הצורך.',
    formSaving: 'שומר…',
    formSaved: 'נשמר מקומית',
    formSaveFailed: 'לא ניתן לשמור. ייתכן שאחסון הדפדפן מלא.',
    undo: 'בטל',
    redo: 'בצע שוב',
    undoShortcut: 'בטל (Ctrl+Z)',
    redoShortcut: 'בצע שוב (Ctrl+Shift+Z)',
    resetForm: 'איפוס לברירת מחדל',
    resetFormConfirm: 'לאפס את כל השדות לתבנית ברירת המחדל? הטיוטה השמורה תימחק.',
    saveAs: 'שמור',
    saveAsPrompt: 'שם לחתימה זו',
    saveAsOverwriteConfirm: 'כבר קיימת חתימה שמורה בשם זה. להחליף?',
    saveAsSuccess: 'נשמר בשם "{name}".',
    saveAsCloudSuccess: 'נשמר בענן בשם "{name}".',
    saveAsCloudTooLarge: 'החתימה גדולה מדי לשמירה בענן (מקסימום 10 MB).',
    saveAsFailedStorage: 'לא ניתן לשמור. ייתכן שאחסון הדפדפן מלא.',
    saveAsFailedTooMany: 'יותר מדי חתימות שמורות. מחקו אחת לפני שמירה נוספת.',
    savedLoadPlaceholder: 'פתיחת שמור…',
    savedLoadSuccess: 'החתימה השמורה נטענה.',
    savedLoadFailed: 'לא ניתן לטעון את החתימה השמורה.',
    savedDelete: 'מחק',
    savedDeleteConfirm: 'למחוק את החתימה השמורה?',
    savedDeleteSuccess: 'החתימה השמורה נמחקה.',
    cloudStorageHint: 'נשמר ב-Vercel Blob (דפדפן זה).',
    exportParams: 'ייצוא הגדרות',
    exportStyle: 'ייצוא סגנון בלבד',
    importParams: 'ייבוא הגדרות',
    paramsExportSuccess: 'ההגדרות יוצאו.',
    paramsStyleExportSuccess: 'הסגנון יוצא.',
    paramsImportSuccess: 'ההגדרות יובאו.',
    paramsStyleImportSuccess: 'הסגנון הוחל. פרטי הקשר שלך נשמרו.',
    paramsImportFailed: 'לא ניתן לייבא הגדרות. ודאו שהקובץ הוא JSON תקין.',
    aiDesignAssistant: 'עוזר עיצוב AI',
    aiDesignLead:
      'תארו את המראה הרצוי — סגנון, צבעים, שפה, טון — והסוכן יכוון פריסה וצבעים. פרטי הקשר נשמרים אלא אם ביקשתם לשנות אותם.',
    aiPresetLabel: 'הנחיות מהירות (לפי העיצוב הנוכחי)',
    aiPresetPlaceholder: 'בחרו תבנית…',
    aiBriefPlaceholder:
      'לדוגמה: חתימה מינימלית בעברית למשרד עורכי דין, דגש כחול כהה, לוגו מימין, מקצועית',
    aiApiKeyLabel: 'מפתח API של OpenAI',
    aiApiKeyPlaceholder: 'sk-... (אופציונלי — בפרודקשן משתמש במפתח מ-Vercel)',
    aiApiKeyUsingEnv: 'משתמש במפתח מ-.env — השאירו ריק כדי להמשיך כך.',
    aiApiKeyUsingServer: 'משתמש במפתח שרת (Vercel) — השאירו ריק אלא אם מחליפים.',
    aiModeRefine: 'ליטוש חתימה קיימת',
    aiModeCreate: 'יצירת חתימה חדשה',
    aiCreateLead:
      'תארו חתימה חדשה מאפס — תחום, סגנון, שפה, צבעים. ה-AI יעצב פריסה וצבעים. כללו שם ותפקיד בטקסט, או סמנו "שמור את פרטי הקשר שלי".',
    aiKeepContact: 'שמור את פרטי הקשר שלי',
    aiCreatePresetLabel: 'רעיונות להתחלה לחתימה חדשה',
    aiCreateBriefPlaceholder:
      'לדוגמה: חתימה חדשה בעברית לסטארטאפ פינטק — מודרני, דגש טורקיז, מינימלי, מנהל מוצר',
    aiDesignButton: 'לטש עם AI',
    aiCreateNewButton: 'צור חדש עם AI',
    aiCreateSuccess: 'חתימה חדשה נוצרה.',
    aiDesignWorking: 'מעצב את החתימה…',
    aiDesignSuccess: 'העיצוב הוחל.',
    aiDesignMissingBrief: 'תארו קודם את סגנון החתימה הרצוי.',
    aiDesignMissingApiKey:
      'הוסיפו מפתח OpenAI למעלה, הגדירו VITE_OPENAI_API_KEY ב-.env לפיתוח מקומי, או OPENAI_API_KEY ב-Vercel.',
    aiDesignFailed: 'עיצוב ה-AI נכשל. בדקו את מפתח ה-API ונסו שוב.',
    aiSignaturePreview: 'תצוגה מקדימה של החתימה',
    contactDetails: 'פרטי קשר',
    language: 'שפה',
    langEnglish: 'English',
    langHebrew: 'עברית',
    fullName: 'שם מלא',
    outlookSignatureName: 'שם חתימה ב-Outlook (באנגלית)',
    outlookSignatureNamePlaceholder: 'Hila Melinovsky',
    outlookSignatureNameHint:
      'שם שמופיע ברשימת החתימות ב-Outlook הקלאסי. מומלץ באנגלית כשהשם המלא בעברית.',
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
    logoPlacement: 'מיקום לוגו',
    logoPlacementHint:
      'בחרו בצד החתימה שבו יופיע הלוגו, ואז כוונו מיקום אופקי ואנכי. התצוגה המקדימה מתעדכנת מיד.',
    logoPlacementHorizontal: 'מיקום אופקי',
    logoPlacementVertical: 'מיקום אנכי',
    logoSide: 'צד לוגו',
    logoHorizontalPlacement: 'מיקום אופקי',
    logoHorizontalPlacementHint: 'ערך שלילי — לכיוון הקצה החיצוני; חיובי — לכיוון קו ההפרדה מהטקסט.',
    logoVerticalPlacement: 'מיקום אנכי',
    logoVerticalPlacementHint: 'ערך שלילי — למעלה; חיובי — למטה.',
    logoSideLeft: 'שמאל',
    logoSideRight: 'ימין',
    bannerUrl: 'כתובת באנר',
    bannerFile: 'קובץ באנר',
    bannerLink: 'קישור באנר',
    urlPlaceholder: 'https://...',
    socialMedia: 'רשתות חברתיות',
    socialMediaHint:
      'הוסיפו כתובות פרופיל לרשתות שבהן אתם משתמשים. בחרו סגנון אייקון מובנה או העלו כתובת/קובץ משלכם.',
    socialIconVariantLabel: 'סגנון אייקון',
    socialIconVariantHint: 'בחרו סגנון אייקון מובנה לרשת זו.',
    socialIconVariantExpandHint:
      'פתחו כל רשת למטה. בוחר סגנון האייקון נמצא בתוך כל מקטע רשת.',
    socialIconVariantLoading: 'טוען תצוגות מקדימות של אייקונים…',
    socialIconVariantLoadFailed:
      'לא ניתן לטעון תצוגות מקדימות. רעננו את הדף או נסו דפדפן אחר.',
    socialIconVariantCustomActive:
      'בשימוש אייקון מותאם אישית. נקו את השדה כדי לבחור שוב סגנון מובנה.',
    socialIconVariantBrand: 'צבע מותג',
    socialIconVariantMono: 'מונוכרום',
    socialIconVariantWhite: 'לבן',
    socialIconVariantGradient: 'גרדיאנט',
    socialIconVariantBadge: 'תג',
    profileUrl: 'כתובת פרופיל',
    iconUrl: 'כתובת אייקון',
    iconFile: 'קובץ אייקון',
    optionalPlaceholder: 'אופציונלי',
    layoutTypography: 'פריסה וטיפוגרפיה',
    brandPreset: 'תבנית מותג',
    brandPresetPlaceholder: 'החלת תבנית מותג...',
    brandPresetHint:
      'חולץ מספר המותג 2025 של הסוכנות: צבעים #4d4c4f, #dadee7, #a74e8d, #30bbed, #4c4c4e, #33ccff, #88236f; גופנים Rubik ו-Cairo.',
    brandColors: 'צבעי המותג שחולצו',
    fontFamily: 'גופן',
    outlookFontHint:
      'התקנה ב-Outlook מורידה ומתקינה אוטומטית את Rubik או Cairo ב-Windows, ואז מגדירה את החתימה. הפעילו מחדש את Outlook אחרי הרצת המתקין. נמענים עדיין עלולים לראות גופן חלופי אם הגופן לא מותקן אצלם.',
    installWindowsFont: 'התקנת {font} בלבד',
    downloadFontFromGoogle: 'הורדה מ-Google Fonts',
    alertWindowsFontInstallSuccess:
      'מתקין הגופן הורד. לחצו פעמיים עליו להתקנה ב-Windows, הפעילו מחדש את Outlook והתקינו שוב את החתימה.',
    alertWindowsFontInstallFailed: 'לא ניתן להכין את מתקין הגופן.',
    batWindowsFontDownloading: 'מוריד קבצי גופן…',
    batWindowsFontInstalling: 'מתקין גופנים ב-Windows…',
    batWindowsFontMissingFiles: 'לא נמצאו קבצי גופן בחבילה שהורדה.',
    batWindowsFontFolderFailed: 'לא ניתן לפתוח את תיקיית הגופנים של Windows.',
    batWindowsFontSuccess: 'הגופן הותקן ב-Windows.',
    batWindowsFontRestartOutlook: 'הפעילו מחדש את Outlook והתקינו שוב את החתימה.',
    batWindowsFontDone: 'התקנת הגופן הושלמה.',
    batWindowsFontFailed: 'התקנת הגופן נכשלה. נסו להוריד ידנית מ-Google Fonts.',
    batWindowsFontInstallSkipped:
      'לא ניתן להתקין את הגופן אוטומטית — החתימה עדיין תותקן. התקינו את הגופן ידנית במידת הצורך.',
    nameFontWeight: 'משקל שם',
    titleFontWeight: 'משקל תפקיד',
    bodyFontWeight: 'משקל גוף',
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
    emailAlign: 'מיקום בדוא"ל',
    logoAlign: 'יישור לוגו',
    verticalAlign: 'יישור אנכי',
    textOffsetX: 'היסט טקסט אופקי',
    textOffsetY: 'היסט טקסט אנכי',
    logoOffsetX: 'היסט לוגו אופקי',
    logoOffsetY: 'היסט לוגו אנכי',
    dividerThickness: 'עובי מפריד',
    socialIconGap: 'ריווח אייקונים חברתיים',
    alignLeft: 'שמאל',
    alignCenter: 'מרכז',
    alignRight: 'ימין',
    alignTop: 'למעלה',
    alignMiddle: 'אמצע',
    alignBottom: 'למטה',
    colors: 'צבעים',
    elementColorsHint: 'הגדירו צבע לכל חלק בחתימה.',
    accent: 'הדגשה',
    primaryText: 'טקסט ראשי',
    secondaryText: 'טקסט משני',
    contactLabels: 'תוויות פרטי קשר',
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
    installGuide: 'איך מתקינים ב-Outlook',
    installGuideLead: 'עקבו אחר השלבים להתקנת החתימה ב-Outlook הקלאסי (שולחן עבודה).',
    installGuideAlt:
      'מדריך מונפש: יצירת חתימה, התקנה ב-Outlook, הרצת קובץ ההתקנה והפעלה מחדש של Outlook',
    newOutlookSetup: 'הגדרת Outlook החדש',
    preview: 'תצוגה מקדימה',
    livePreviewHint: 'בגודל אמיתי כמו בגוף הודעה ב-Outlook. מתעדכנת בזמן עריכה.',
    outlookPreviewTitle: 'הודעה חדשה',
    outlookPreviewTo: 'אל',
    outlookPreviewPlaceholder: 'כתבו את ההודעה כאן…',
    styleSummary: 'סיכום סגנון',
    styleSummaryTypeScale: 'סולם טיפוגרפי',
    styleSummaryDimensions: 'גודל קנבס',
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
    exportSignaturesZipLink: 'ZIP ל-IT',
    signatureFolderSuffix: '.',
    batSignaturesZipCreated: 'קובץ ZIP נוצר בשולחן העבודה:',
    batSignaturesZipFailed:
      'לא ניתן ליצור ZIP. הריצו התקנה ב-Outlook תחילה, או ודאו שתיקיית החתימות לא ריקה.',
    newOutlookSetupPrefix: 'הגדרת Outlook החדש: פתחו ',
    newOutlookSetupSuffix: ' — הדביקו בעורך החתימה ושמרו.',
    alertGenerateFailed: 'לא ניתן ליצור אייקונים חברתיים. נסו שוב.',
    alertOutlookInstallSuccess:
      'הורד install-outlook-signature.bat. הוא מתקין את הגופן ב-Windows ואת החתימה בצעד אחד. לחצו פעמיים על הקובץ, ואז הפעילו מחדש את Outlook. ב-Outlook חפשו את שם החתימה באנגלית שהזנתם (או את שם המשתמש מהאימייל אם השדה ריק).',
    alertOutlookInstallFailed: 'לא ניתן להכין את מתקין Outlook. יש ליצור חתימה תחילה.',
    batInstallerCorrupt: 'קובץ ההתקנה פגום.',
    batInstallComplete: 'התקנת החתימה הושלמה.',
    batInstallFailed: 'ההתקנה נכשלה.',
    batInstallSecurityHint: 'אם מוצגת אזהרת אבטחה, בחרו מידע נוסף ואז הפעל בכל זאת.',
    batPsInstallSuccess: 'החתימה הותקנה בהצלחה:',
    batPsSetDefault: 'הוגדרה כברירת מחדל למייל חדש/תשובה (במקומות שנתמכים).',
    batPsRestartOutlook: 'אם Outlook היה פתוח, הפעילו אותו מחדש כדי לרענן חתימות.',
    batPsClassicNote:
      'הערה: עובד ב-Outlook הקלאסי. Outlook החדש עשוי להתעלם מקבצי חתימה מקומיים.',
    batPressEnterToClose: 'לחצו Enter לסגירה',
    batFolderOpened: 'תיקיית החתימות נפתחה.',
    alertNewOutlookFailed: 'לא ניתן להכין את הגדרת Outlook החדש. יש ליצור חתימה תחילה.',
    alertNewOutlookCopiedOpened:
      'החתימה הועתקה והגדרות Outlook החדש נפתחו. הדביקו בעורך החתימה ולחצו שמור.',
    alertNewOutlookCopied:
      'החתימה הועתקה. פתחו את הגדרות Outlook החדש (כתיבה ומענה), הדביקו בעורך החתימה ולחצו שמור.',
    alertNewOutlookOpenedNoCopy:
      'הגדרות Outlook החדש נפתחו, אך ההעתקה ללוח נחסמה. העתיקו מ-"HTML שנוצר", הדביקו בעורך החתימה ולחצו שמור.',
    alertNewOutlookManual:
      'לא ניתן לפתוח הגדרות או להעתיק אוטומטית. פתחו Outlook החדש > הגדרות > דואר > כתיבה ומענה, והדביקו מ-"HTML שנוצר".',
    imageImport: 'יצירה מתמונה',
    imageImportLead:
      'העלו צילום מסך או קובץ PNG/JPG של חתימה קיימת. ה-AI יקרא את הפרטים הגלויים, ישמור על הצבעים, ימלא את הטופס וייצור חתימת HTML שניתן לערוך.',
    imageImportFile: 'תמונת חתימה',
    imageImportButton: 'קריאת תמונה ויצירת חתימה',
    imageImportWorking: 'קורא את התמונה ויוצר חתימה...',
    imageImportSuccess: 'החתימה נוצרה מהתמונה.',
    imageImportFailed: 'לא ניתן ליצור חתימה מהתמונה.',
    imageImportTooLarge: 'העלו תמונה קטנה מ-5MB.',
    bulkSignatures: 'חתימות בכמות (Excel)',
    bulkSignaturesLead:
      'העלו קובץ Excel עם שורה לכל אדם. לכל שורה נוצר קובץ HTML לפי העיצוב הנוכחי (לוגו, צבעים, פריסה).',
    bulkSignaturesColumns:
      'עמודות: fullName (או שם), jobTitle, company, phone, email, website — שפה אופציונלית (en/he). שורה ראשונה = כותרות.',
    bulkDownloadTemplate: 'הורדת תבנית Excel',
    bulkUploadExcel: 'העלאת Excel (ZIP של HTML)',
    bulkUploadExcelIt: 'העלאת Excel → ZIP ל-IT',
    bulkItHint:
      'ZIP ל-IT בפריסת תיקיית Signatures של Outlook (.htm, .txt, .rtf ו-*_files לכל אדם). שלחו את outlook-signatures-for-it.zip ל-IT. הקישור "ZIP ל-IT" ליד ההתקנה מייצא רק חתימות שכבר מותקנות במחשב זה.',
    bulkWorking: 'יוצר חתימות…',
    bulkItSuccessOne: 'הורד outlook-signatures-for-it.zip עם חתימה אחת ל-IT.',
    bulkItSuccessMany: 'הורד outlook-signatures-for-it.zip עם {count} חתימות ל-IT.',
    bulkSuccessOne: 'הורד signatures.zip עם חתימה אחת.',
    bulkSuccessMany: 'הורד signatures.zip עם {count} חתימות.',
    bulkFailed: 'ייצוא מרובה נכשל.',
    bulkUsesCurrentDesign: 'משתמש בהגדרות העיצוב מהטופס למעלה (לא AI לכל שורה).',
    bulkErrorNoSheets: 'אין גיליונות בקובץ.',
    bulkErrorNoDataRows: 'הוסיפו שורת כותרות ולפחות שורת נתונים אחת.',
    bulkErrorNoColumns: 'לא זוהו עמודות. השתמשו בתבנית או בכותרות כמו fullName, email, phone.',
    bulkErrorNoValidRows: 'לא נמצאו שורות עם שם או דוא"ל.',
    bulkErrorTooManyRows: 'מקסימום 500 אנשים לקובץ.',
    bulkErrorUnknown: 'לא ניתן לקרוא את קובץ ה-Excel.',
    appUpdateAvailable: 'גרסה חדשה זמינה. רעננו כדי לקבל את העדכון האחרון.',
    appUpdateReload: 'רענון',
    appUpdateDismiss: 'אחר כך'
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
  `${t(lang, 'signatureFolderPrefix')}<button type="button" class="text-link open-signatures-folder">${t(lang, 'signatureFolderLink')}</button> · <button type="button" class="text-link export-signatures-zip">${t(lang, 'exportSignaturesZipLink')}</button> <span dir="ltr" class="outlook-folder-path">(${OUTLOOK_SIGNATURES_FOLDER_PATH})</span>${t(lang, 'signatureFolderSuffix')}`

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
