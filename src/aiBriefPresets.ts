import type { AppLanguage, SignatureFormSnapshot, TextAlign } from './aiSignatureDesign'

export type AiBriefPreset = {
  id: string
  label: string
  prompt: string
}

export type AiBriefPresetOptions = {
  hasLogo?: boolean
  hasBanner?: boolean
  hasSocial?: boolean
  hasWebsite?: boolean
}

const fontDisplayName = (fontFamily: string): string => {
  const first = fontFamily.split(',')[0]?.trim() ?? 'Arial'
  return first.replace(/^['"]|['"]$/g, '')
}

const alignWord = (lang: AppLanguage, align: TextAlign): string => {
  if (lang === 'he') {
    if (align === 'left') return 'שמאל'
    if (align === 'center') return 'מרכז'
    return 'ימין'
  }
  return align
}

const preset = (
  id: string,
  snapshot: SignatureFormSnapshot,
  en: { label: string; prompt: string },
  he: { label: string; prompt: string }
): AiBriefPreset => ({
  id,
  ...(snapshot.signatureLanguage === 'he' ? he : en)
})

const buildRefinePreset = (snapshot: SignatureFormSnapshot): AiBriefPreset => {
  const font = fontDisplayName(snapshot.fontFamily)
  const align = alignWord(snapshot.signatureLanguage, snapshot.nameTitleAlign)
  return preset(
    'refine-current',
    snapshot,
    {
      label: 'Refine current design',
      prompt: `Refine the current design without changing contact details: ${font} font, ${snapshot.accentColor} accent, ${snapshot.signatureWidth}px wide, ${snapshot.signatureHeight}px tall, ${snapshot.nameFontSize}px name, ${align} aligned. Improve polish and Outlook compatibility.`
    },
    {
      label: 'ליטוש העיצוב הנוכחי',
      prompt: `לטש את העיצוב הנוכחי בלי לשנות את פרטי הקשר: גופן ${font}, צבע דגש ${snapshot.accentColor}, רוחב ${snapshot.signatureWidth}px, גובה ${snapshot.signatureHeight}px, שם ${snapshot.nameFontSize}px, יישור ${align}. שפר ניגודיות ותאימות ל-Outlook.`
    }
  )
}

export const buildAiBriefPresets = (
  snapshot: SignatureFormSnapshot,
  options: AiBriefPresetOptions = {}
): AiBriefPreset[] => {
  const font = fontDisplayName(snapshot.fontFamily)
  const align = alignWord(snapshot.signatureLanguage, snapshot.nameTitleAlign)
  const logoAlign = alignWord(snapshot.signatureLanguage, snapshot.logoAlign)
  const widerTarget = Math.min(900, snapshot.signatureWidth + 80)
  const narrowerTarget = Math.max(250, snapshot.signatureWidth - 60)

  const presets: AiBriefPreset[] = [
    buildRefinePreset(snapshot),
    preset(
      'more-minimal',
      snapshot,
      {
        label: 'More minimal & compact',
        prompt: `Make the current signature (${snapshot.accentColor} accent, ${snapshot.signatureWidth}px wide) more minimal: reduce body size from ${snapshot.bodyFontSize}px, tighter spacing and height, keep a professional look.`
      },
      {
        label: 'מינימלי וקומפקטי יותר',
        prompt: `הפוך את החתימה הנוכחית (דגש ${snapshot.accentColor}, רוחב ${snapshot.signatureWidth}px) למינימלית וקומפקטית: הקטן גודל גוף מ-${snapshot.bodyFontSize}px, צמצם ריווח וגובה, שמור על מראה מקצועי.`
      }
    ),
    preset(
      'bolder',
      snapshot,
      {
        label: 'Bolder & more prominent',
        prompt: `Make the current signature stand out more: increase name from ${snapshot.nameFontSize}px, strengthen ${snapshot.accentColor} accent, clearer hierarchy, keep the same overall structure.`
      },
      {
        label: 'בולט וחזק יותר',
        prompt: `הדגש את החתימה הנוכחית: הגדל שם מ-${snapshot.nameFontSize}px, חזק את צבע הדגש ${snapshot.accentColor}, היררכיה ברורה יותר, שמור על אותו מבנה כללי.`
      }
    ),
    preset(
      'contrast',
      snapshot,
      {
        label: 'Improve contrast & readability',
        prompt: `Improve readability of the current signature: better contrast between ${snapshot.accentColor} accent, ${snapshot.secondaryTextColor} secondary text, and background. Meet WCAG AA for Outlook.`
      },
      {
        label: 'שפר ניגודיות וקריאות',
        prompt: `שפר קריאות בחתימה הנוכחית: ניגודיות טובה יותר בין דגש ${snapshot.accentColor}, טקסט משני ${snapshot.secondaryTextColor} ורקע. עמוד ב-WCAG AA ב-Outlook.`
      }
    ),
    preset(
      'compact',
      snapshot,
      {
        label: 'Reduce signature height',
        prompt: `Shrink signature height from ${snapshot.signatureHeight}px: tighter line spacing, less vertical padding, keep ${snapshot.signatureWidth}px width and ${snapshot.accentColor} accent.`
      },
      {
        label: 'הקטן גובה חתימה',
        prompt: `צמצם את גובה החתימה מ-${snapshot.signatureHeight}px: ריווח שורות הדוק יותר, פחות רווח אנכי, שמור רוחב ${snapshot.signatureWidth}px וצבע דגש ${snapshot.accentColor}.`
      }
    ),
    preset(
      'airy',
      snapshot,
      {
        label: 'More airy & spacious',
        prompt: `Add breathing room to the current design (${snapshot.signatureWidth}px, line spacing ${snapshot.lineSpacing}): slightly taller signature, more padding, keep ${snapshot.accentColor} accent and ${font} font.`
      },
      {
        label: 'מרווח ואוורירי יותר',
        prompt: `הוסף אוויר לעיצוב הנוכחי (רוחב ${snapshot.signatureWidth}px, ריווח ${snapshot.lineSpacing}): גובה מעט גדול יותר, יותר ריווח, שמור דגש ${snapshot.accentColor} וגופן ${font}.`
      }
    ),
    preset(
      'executive',
      snapshot,
      {
        label: 'Executive / C-level minimal',
        prompt: `Executive-style signature from current settings: understated ${snapshot.accentColor}, smaller body (${snapshot.bodyFontSize}px → ~11px), elegant hierarchy, no clutter, premium feel.`
      },
      {
        label: 'מינימלי להנהלה בכירה',
        prompt: `חתימת הנהלה מההגדרות הנוכחיות: דגש ${snapshot.accentColor} עדין, גוף קטן יותר (מ-${snapshot.bodyFontSize}px), היררכיה אלגנטית, בלי עומס, מראה פרימיום.`
      }
    ),
    preset(
      'creative',
      snapshot,
      {
        label: 'Creative & modern',
        prompt: `Modernize the current signature (${snapshot.accentColor}, ${font}): contemporary color pairing, slightly bolder name, clean lines, still Outlook-safe tables.`
      },
      {
        label: 'יצירתי ומודרני',
        prompt: `עדכן לעיצוב מודרני (${snapshot.accentColor}, ${font}): שילוב צבעים עכשווי, שם מעט בולט יותר, קווים נקיים, טבלאות תואמות Outlook.`
      }
    ),
    preset(
      'tech-startup',
      snapshot,
      {
        label: 'Tech / startup style',
        prompt: `Tech startup look based on current layout: Segoe UI or Calibri, crisp ${snapshot.accentColor} accent, balanced sizes (name ${snapshot.nameFontSize}px), friendly professional tone.`
      },
      {
        label: 'סטארטאפ / הייטק',
        prompt: `מראה סטארטאפ מהפריסה הנוכחית: Segoe UI או Calibri, דגש ${snapshot.accentColor} חד, גדלים מאוזנים (שם ${snapshot.nameFontSize}px), טון מקצועי ונגיש.`
      }
    ),
    preset(
      'legal',
      snapshot,
      {
        label: 'Legal / finance conservative',
        prompt: `Conservative legal/finance style: Times New Roman or Georgia, muted palette derived from ${snapshot.accentColor}, formal spacing, ${align} alignment, no decorative elements.`
      },
      {
        label: 'משפטי / פיננסי שמרני',
        prompt: `סגנון משפטי/פיננסי שמרני: Times New Roman או Georgia, פלטה מאופקת מהדגש ${snapshot.accentColor}, ריווח רשמי, יישור ${align}, בלי קישוטים.`
      }
    ),
    preset(
      'sales',
      snapshot,
      {
        label: 'Sales & marketing energetic',
        prompt: `Energetic sales signature from current design: stronger ${snapshot.accentColor}, larger name (from ${snapshot.nameFontSize}px), clear CTA feel, keep contact block readable.`
      },
      {
        label: 'מכירות ושיווק אנרגטי',
        prompt: `חתימת מכירות אנרגטית מהעיצוב הנוכחי: דגש ${snapshot.accentColor} חזק יותר, שם גדול (מ-${snapshot.nameFontSize}px), תחושת קריאה לפעולה, בלוק קשר קריא.`
      }
    ),
    preset(
      'healthcare',
      snapshot,
      {
        label: 'Healthcare calm & trustworthy',
        prompt: `Healthcare-appropriate palette from ${snapshot.accentColor}: calm blues/teals, soft secondary text, approachable ${font}, trustworthy and clean for Outlook.`
      },
      {
        label: 'בריאות — רגוע ואמין',
        prompt: `פלטה מתאימה לבריאות מהדגש ${snapshot.accentColor}: כחול/טורקיז רגוע, טקסט משני רך, ${font} נגיש, מראה נקי ואמין ל-Outlook.`
      }
    ),
    preset(
      'monochrome',
      snapshot,
      {
        label: 'Monochrome professional',
        prompt: `Convert current design to monochrome: grayscale hierarchy using ${snapshot.secondaryTextColor} tones, single subtle accent, same layout (${snapshot.signatureWidth}px).`
      },
      {
        label: 'מונוכרום מקצועי',
        prompt: `המר לעיצוב מונוכרום: היררכיה בגווני אפור מ-${snapshot.secondaryTextColor}, דגש עדין אחד, אותה פריסה (${snapshot.signatureWidth}px).`
      }
    ),
    preset(
      'pastel',
      snapshot,
      {
        label: 'Softer pastel palette',
        prompt: `Soften colors from current accent ${snapshot.accentColor} and secondary ${snapshot.secondaryTextColor}: lighter pastel professional tones, keep sizes and ${align} alignment.`
      },
      {
        label: 'פלטת פסטל רכה',
        prompt: `רכך צבעים מהדגש ${snapshot.accentColor} ומשני ${snapshot.secondaryTextColor}: גווני פסטל מקצועיים, שמור גדלים ויישור ${align}.`
      }
    ),
    preset(
      'color-refresh',
      snapshot,
      {
        label: 'Refresh color palette',
        prompt: `Refresh the color palette from the current design (accent ${snapshot.accentColor}, secondary ${snapshot.secondaryTextColor}): modern professional tones, keep the same layout and sizes.`
      },
      {
        label: 'רענון פלטת צבעים',
        prompt: `רענן את פלטת הצבעים מהעיצוב הנוכחי (דגש ${snapshot.accentColor}, משני ${snapshot.secondaryTextColor}): גוונים מודרניים ומקצועיים, שמור את אותה פריסה וגדלים.`
      }
    ),
    preset(
      'corporate',
      snapshot,
      {
        label: 'More corporate & formal',
        prompt: `Shift the current design (${font}, ${snapshot.accentColor}) to a formal corporate look: restrained colors, balanced sizes, no flashy effects, Outlook-safe.`
      },
      {
        label: 'מראה תאגידי רשמי',
        prompt: `הפוך את העיצוב הנוכחי (${font}, ${snapshot.accentColor}) למראה תאגידי רשמי: צבעים מאופקים, גדלים מאוזנים, בלי אפקטים מיותרים, מתאים ל-Outlook.`
      }
    ),
    preset(
      'centered',
      snapshot,
      {
        label: 'Centered name & title',
        prompt: `Center-align name and title (currently ${snapshot.nameTitleAlign}): centered block with ${snapshot.accentColor} accent, keep contact details ${snapshot.textAlign} as today.`
      },
      {
        label: 'מרכז שם ותפקיד',
        prompt: `יישר למרכז שם ותפקיד (כיום ${snapshot.nameTitleAlign}): בלוק ממורכז עם דגש ${snapshot.accentColor}, שמור פרטי קשר ביישור ${snapshot.textAlign}.`
      }
    ),
    preset(
      'title-emphasis',
      snapshot,
      {
        label: 'Emphasize job title',
        prompt: `Strengthen job title hierarchy: increase title from ${snapshot.titleFontSize}px, use ${snapshot.secondaryTextColor} vs ${snapshot.accentColor} for name, keep ${font}.`
      },
      {
        label: 'הדגש תפקיד',
        prompt: `חזק היררכיית תפקיד: הגדל תפקיד מ-${snapshot.titleFontSize}px, הבחן בין שם (${snapshot.accentColor}) לתפקיד (${snapshot.secondaryTextColor}), שמור ${font}.`
      }
    ),
    preset(
      'contact-emphasis',
      snapshot,
      {
        label: 'Emphasize contact block',
        prompt: `Make phone/email/website more scannable: body ${snapshot.bodyFontSize}px, clearer link styling, accent ${snapshot.accentColor} on labels, same width ${snapshot.signatureWidth}px.`
      },
      {
        label: 'הדגש בלוק קשר',
        prompt: `הפוך טלפון/מייל/אתר לקריאים יותר: גוף ${snapshot.bodyFontSize}px, קישורים ברורים, דגש ${snapshot.accentColor} בתוויות, אותו רוחב ${snapshot.signatureWidth}px.`
      }
    ),
    preset(
      'divider-strong',
      snapshot,
      {
        label: 'Stronger divider line',
        prompt: `Use a clearer vertical divider between text and logo: slightly thicker line, color harmonized with ${snapshot.accentColor}, current logo ${logoAlign}.`
      },
      {
        label: 'קו מפריד בולט יותר',
        prompt: `קו אנכי ברור יותר בין טקסט ללוגו: עובי מעט גדול, צבע בהרמוניה ל-${snapshot.accentColor}, לוגו ${logoAlign} כיום.`
      }
    ),
    preset(
      'unify-align',
      snapshot,
      {
        label: 'Unify all alignment',
        prompt: `Align name, title, contact, and logo consistently to ${snapshot.textAlign} (currently mixed). Keep ${snapshot.accentColor} and ${snapshot.signatureWidth}px layout.`
      },
      {
        label: 'אחד יישור',
        prompt: `יישר שם, תפקיד, קשר ולוגו באופן עקבי ל-${snapshot.textAlign}. שמור דגש ${snapshot.accentColor} ורוחב ${snapshot.signatureWidth}px.`
      }
    ),
    preset(
      'mobile-first',
      snapshot,
      {
        label: 'Mobile-first compact',
        prompt: `Optimize for mobile email clients: max width ~320px feel, stack-friendly, body ≤${snapshot.bodyFontSize}px, from current ${snapshot.signatureWidth}px design with ${snapshot.accentColor}.`
      },
      {
        label: 'מותאם מובייל',
        prompt: `אופטימיזציה למובייל: תחושת רוחב ~320px, מתאים לערימה, גוף ≤${snapshot.bodyFontSize}px, מהעיצוב ${snapshot.signatureWidth}px עם דגש ${snapshot.accentColor}.`
      }
    )
  ]

  if (snapshot.signatureWidth < 520) {
    presets.push(
      preset(
        'wider',
        snapshot,
        {
          label: 'Widen the layout',
          prompt: `Widen the signature from ${snapshot.signatureWidth}px to about ${widerTarget}px: more room for text and logo, keep colors (${snapshot.accentColor}) and ${snapshot.textAlign} alignment.`
        },
        {
          label: 'הרחב את הפריסה',
          prompt: `הרחב את החתימה מ-${snapshot.signatureWidth}px לכ-${widerTarget}px בערך: יותר מקום לטקסט ולוגו, שמור צבעים (${snapshot.accentColor}) ויישור ${alignWord('he', snapshot.textAlign)}.`
        }
      )
    )
  } else {
    presets.push(
      preset(
        'narrower',
        snapshot,
        {
          label: 'Narrow the layout',
          prompt: `Narrow width from ${snapshot.signatureWidth}px to about ${narrowerTarget}px: tighter layout for mobile, keep ${snapshot.accentColor} accent and ${font} font.`
        },
        {
          label: 'צמצם רוחב',
          prompt: `צמצם רוחב מ-${snapshot.signatureWidth}px לכ-${narrowerTarget}px: פריסה צפופה יותר למובייל, שמור דגש ${snapshot.accentColor} וגופן ${font}.`
        }
      )
    )
  }

  if (snapshot.lineSpacing < 1.2) {
    presets.push(
      preset(
        'looser-lines',
        snapshot,
        {
          label: 'Increase line spacing',
          prompt: `Increase line spacing from ${snapshot.lineSpacing}: more readable multi-line blocks, keep name ${snapshot.nameFontSize}px and accent ${snapshot.accentColor}.`
        },
        {
          label: 'הגדל ריווח שורות',
          prompt: `הגדל ריווח שורות מ-${snapshot.lineSpacing}: בלוקים קריאים יותר, שמור שם ${snapshot.nameFontSize}px ודגש ${snapshot.accentColor}.`
        }
      )
    )
  } else {
    presets.push(
      preset(
        'tighter-lines',
        snapshot,
        {
          label: 'Tighter line spacing',
          prompt: `Tighten line spacing from ${snapshot.lineSpacing}: denser signature, reduce height from ${snapshot.signatureHeight}px, keep ${snapshot.accentColor}.`
        },
        {
          label: 'צמצם ריווח שורות',
          prompt: `צמצם ריווח שורות מ-${snapshot.lineSpacing}: חתימה דחוסה יותר, הקטן גובה מ-${snapshot.signatureHeight}px, שמור ${snapshot.accentColor}.`
        }
      )
    )
  }

  if (snapshot.signatureLanguage === 'he') {
    presets.push(
      preset(
        'rtl-hebrew',
        snapshot,
        {
          label: 'Hebrew RTL optimization',
          prompt: `Optimize for Hebrew RTL (current accent ${snapshot.accentColor}, align ${align}): right-aligned readable font, professional Israeli business style. Keep contact details.`
        },
        {
          label: 'אופטימיזציה לעברית (RTL)',
          prompt: `אופטימיזציה לעברית RTL (דגש ${snapshot.accentColor}, יישור ${align}): גופן קריא, יישור ימין, מראה עסקי ישראלי מקצועי. שמור פרטי קשר.`
        }
      ),
      preset(
        'switch-en',
        snapshot,
        {
          label: 'Adapt for English (LTR)',
          prompt: `Adapt current Hebrew design to English LTR: left alignment, Latin-friendly font instead of ${font}, keep ${snapshot.accentColor} and proportions.`
        },
        {
          label: 'התאם לאנגלית (LTR)',
          prompt: `התאם עיצוב עברי נוכחי לאנגלית LTR: יישור שמאל, גופן לטיני במקום ${font}, שמור ${snapshot.accentColor} ופרופורציות.`
        }
      )
    )
  } else {
    presets.push(
      preset(
        'switch-he',
        snapshot,
        {
          label: 'Adapt for Hebrew (RTL)',
          prompt: `Adapt current English design to Hebrew RTL: right alignment, Tahoma/Arial, keep ${snapshot.accentColor} and layout proportions (${snapshot.signatureWidth}px).`
        },
        {
          label: 'התאם לעברית (RTL)',
          prompt: `התאם עיצוב אנגלי נוכחי לעברית RTL: יישור ימין, Tahoma/Arial, שמור ${snapshot.accentColor} ופרופורציות (${snapshot.signatureWidth}px).`
        }
      )
    )
  }

  if (snapshot.company.trim()) {
    presets.push(
      preset(
        'highlight-company',
        snapshot,
        {
          label: `Highlight ${snapshot.company}`,
          prompt: `Emphasize company name "${snapshot.company}" in the current signature (${snapshot.accentColor} accent, ${font} font). Keep name and title clear and professional.`
        },
        {
          label: `הדגש את ${snapshot.company}`,
          prompt: `הדגש את שם החברה "${snapshot.company}" בחתימה הנוכחית (דגש ${snapshot.accentColor}, גופן ${font}). שמור שם ותפקיד ברורים, מראה מקצועי.`
        }
      )
    )
  }

  if (options.hasLogo) {
    presets.push(
      preset(
        'logo-focus',
        snapshot,
        {
          label: 'Emphasize logo placement',
          prompt: `Emphasize the logo in the current layout (logo ${snapshot.logoAlign}, max ${snapshot.logoMaxWidth}px): better balance between logo and text, keep ${snapshot.accentColor} accent.`
        },
        {
          label: 'הדגש לוגו',
          prompt: `הדגש את הלוגו בפריסה הנוכחית (יישור לוגו ${logoAlign}, רוחב מקס ${snapshot.logoMaxWidth}px): איזון טוב יותר בין לוגו לטקסט, שמור דגש ${snapshot.accentColor}.`
        }
      ),
      preset(
        'logo-larger',
        snapshot,
        {
          label: 'Larger logo',
          prompt: `Increase logo presence from max ${snapshot.logoMaxWidth}px: wider logo column, logo ${snapshot.logoAlign}, maintain ${snapshot.accentColor} and text column balance.`
        },
        {
          label: 'לוגו גדול יותר',
          prompt: `הגדל נוכחות לוגו מ-${snapshot.logoMaxWidth}px מקס: עמודת לוגו רחבה יותר, לוגו ${logoAlign}, שמור איזון עם עמודת טקסט ודגש ${snapshot.accentColor}.`
        }
      ),
      preset(
        'swap-logo-side',
        snapshot,
        {
          label: 'Move logo to opposite side',
          prompt: `Swap logo to the opposite side from current ${snapshot.logoAlign}: mirror layout, keep ${snapshot.signatureWidth}px and ${snapshot.accentColor}.`
        },
        {
          label: 'העבר לוגו לצד השני',
          prompt: `העבר לוגו לצד הנגדי מ-${logoAlign} הנוכחי: פריסה מראית, שמור ${snapshot.signatureWidth}px ודגש ${snapshot.accentColor}.`
        }
      )
    )
  }

  if (options.hasBanner) {
    presets.push(
      preset(
        'banner-optimize',
        snapshot,
        {
          label: 'Optimize for banner',
          prompt: `Layout tuned for a promotional banner below: leave room under contact block, cohesive ${snapshot.accentColor} with banner, width ${snapshot.signatureWidth}px.`
        },
        {
          label: 'מותאם לבאנר',
          prompt: `פריסה מותאמת לבאנר פרסומי מתחת: מקום מתחת לבלוק קשר, התאמת ${snapshot.accentColor} לבאנר, רוחב ${snapshot.signatureWidth}px.`
        }
      )
    )
  }

  if (options.hasSocial) {
    presets.push(
      preset(
        'social-prominent',
        snapshot,
        {
          label: 'Prominent social icons',
          prompt: `Make social icons more visible: increase gap from ${snapshot.socialIconGap}px, align with ${snapshot.accentColor} brand feel, keep Outlook table layout.`
        },
        {
          label: 'אייקונים חברתיים בולטים',
          prompt: `הפוך אייקונים חברתיים לבולטים יותר: הגדל ריווח מ-${snapshot.socialIconGap}px, התאם לדגש ${snapshot.accentColor}, שמור טבלאות Outlook.`
        }
      ),
      preset(
        'social-minimal',
        snapshot,
        {
          label: 'Subtle social icons',
          prompt: `Subtle social row: smaller icon spacing (from ${snapshot.socialIconGap}px), muted grays, professional not flashy.`
        },
        {
          label: 'אייקונים חברתיים עדינים',
          prompt: `שורת רשתות עדינה: ריווח קטן יותר (מ-${snapshot.socialIconGap}px), אפורים מעודנים, מקצועי לא בוהק.`
        }
      )
    )
  }

  if (options.hasWebsite) {
    presets.push(
      preset(
        'website-brand',
        snapshot,
        {
          label: 'Harmonize with website',
          prompt: `Harmonize colors with website ${snapshot.website}: evolve from accent ${snapshot.accentColor}, professional link color, same layout.`
        },
        {
          label: 'התאם לאתר',
          prompt: `התאם צבעים לאתר ${snapshot.website}: התפתחות מהדגש ${snapshot.accentColor}, צבע קישור מקצועי, אותה פריסה.`
        }
      )
    )
  }

  if (snapshot.fullName.trim() && snapshot.jobTitle.trim()) {
    presets.push(
      preset(
        'name-title-split',
        snapshot,
        {
          label: 'Clear name vs title contrast',
          prompt: `Stronger visual split between "${snapshot.fullName}" and "${snapshot.jobTitle}": size/weight contrast, accent ${snapshot.accentColor} on name only.`
        },
        {
          label: 'הפרדה ברורה שם/תפקיד',
          prompt: `הפרדה חזותית בין "${snapshot.fullName}" ל-"${snapshot.jobTitle}": ניגוד גודל/משקל, דגש ${snapshot.accentColor} רק על השם.`
        }
      )
    )
  }

  return presets
}

export const presetPromptsFromList = (presets: AiBriefPreset[]): Map<string, string> =>
  new Map(presets.map((item) => [item.id, item.prompt]))
