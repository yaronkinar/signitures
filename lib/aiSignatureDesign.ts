export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'
export type AppLanguage = 'en' | 'he'

export const ALLOWED_FONT_FAMILIES = [
  'Arial, Helvetica, sans-serif',
  "'Comeback SemiBold', 'Comeback Semi', Comeback, Arial, Helvetica, sans-serif",
  "'Calibri', Arial, Helvetica, sans-serif",
  "'Segoe UI', Arial, Helvetica, sans-serif",
  "'Tahoma', Arial, Helvetica, sans-serif",
  "'Verdana', Arial, Helvetica, sans-serif",
  "'Trebuchet MS', Arial, Helvetica, sans-serif",
  "'Times New Roman', Times, serif",
  "'Georgia', serif"
] as const

export type AiDesignMode = 'refine' | 'create'

export type AiSignatureDesign = {
  designSummary: string
  contact?: {
    signatureLanguage?: AppLanguage
    fullName?: string
    jobTitle?: string
    company?: string
    phone?: string
    email?: string
    website?: string
  }
  layout?: {
    fontFamily?: string
    nameFontSize?: number
    titleFontSize?: number
    bodyFontSize?: number
    lineSpacing?: number
    signatureWidth?: number
    signatureHeight?: number
    textColumnWidth?: number
    logoMaxWidth?: number
    textAlign?: TextAlign
    nameTitleAlign?: TextAlign
    emailAlign?: TextAlign
    logoAlign?: TextAlign
    verticalAlign?: VerticalAlign
    textOffsetX?: number
    textOffsetY?: number
    logoOffsetX?: number
    logoOffsetY?: number
    dividerThickness?: number
    socialIconGap?: number
  }
  colors?: {
    accentColor?: string
    textColor?: string
    secondaryTextColor?: string
    dividerColor?: string
    linkColor?: string
    backgroundColor?: string
  }
  social?: {
    facebookUrl?: string
    instagramUrl?: string
    linkedinUrl?: string
    xUrl?: string
    youtubeUrl?: string
  }
}

export type SignatureFormSnapshot = {
  signatureLanguage: AppLanguage
  fullName: string
  jobTitle: string
  company: string
  phone: string
  email: string
  website: string
  fontFamily: string
  nameFontSize: number
  titleFontSize: number
  bodyFontSize: number
  lineSpacing: number
  signatureWidth: number
  signatureHeight: number
  textColumnWidth: number
  logoMaxWidth: number
  textAlign: TextAlign
  nameTitleAlign: TextAlign
  emailAlign: TextAlign
  logoAlign: TextAlign
  verticalAlign: VerticalAlign
  accentColor: string
  secondaryTextColor: string
  socialIconGap: number
  dividerThickness: number
}

export const AI_DESIGN_JSON_SCHEMA = `{
  "designSummary": "string ΓÇö 1-2 sentences explaining the design choices",
  "contact": {
    "signatureLanguage": "en | he (optional)",
    "fullName": "string (optional, only if user provided)",
    "jobTitle": "string (optional)",
    "company": "string (optional)",
    "phone": "string (optional)",
    "email": "string (optional)",
    "website": "string (optional)"
  },
  "layout": {
    "fontFamily": "one of the allowed font stack values",
    "nameFontSize": 14-72,
    "titleFontSize": 10-48,
    "bodyFontSize": 9-24,
    "lineSpacing": 1-2,
    "signatureWidth": 250-900,
    "signatureHeight": 120-500,
    "textColumnWidth": 120-760,
    "logoMaxWidth": 60-400,
    "textAlign": "left | center | right",
    "nameTitleAlign": "left | center | right",
    "emailAlign": "left | center | right",
    "logoAlign": "left | center | right",
    "verticalAlign": "top | middle | bottom",
    "textOffsetX": -120 to 120,
    "textOffsetY": -120 to 120,
    "logoOffsetX": -120 to 120,
    "logoOffsetY": -120 to 120,
    "dividerThickness": 0-10,
    "socialIconGap": 0-20
  },
  "colors": {
    "accentColor": "#RRGGBB",
    "textColor": "#RRGGBB",
    "secondaryTextColor": "#RRGGBB",
    "dividerColor": "#RRGGBB",
    "linkColor": "#RRGGBB",
    "backgroundColor": "#RRGGBB"
  },
  "social": {
    "facebookUrl": "url or empty",
    "instagramUrl": "url or empty",
    "linkedinUrl": "url or empty",
    "xUrl": "url or empty",
    "youtubeUrl": "url or empty"
  }
}`

const SHARED_RULES = `- Return ONLY valid JSON matching the schema. No markdown fences or commentary.
- Optimize for Outlook: table-based layout, web-safe fonts, readable contrast (WCAG AA).
- Hebrew/RTL: set signatureLanguage to "he", align text right, prefer Tahoma or Arial.
- Colors must be 6-digit hex (#RRGGBB).
- fontFamily must be exactly one of:
${ALLOWED_FONT_FAMILIES.map((f) => `  - ${f}`).join('\n')}`

export const buildAiSystemPrompt = (mode: AiDesignMode = 'refine'): string => {
  if (mode === 'create') {
    return `You are an expert email signature designer for Microsoft Outlook HTML signatures.

You are creating a BRAND NEW signature from scratch based on the user's brief. Do not copy or tweak an old design ΓÇö invent a cohesive layout, typography scale, and color palette that fits the brief.

Rules:
${SHARED_RULES}
- You MUST return complete "layout" and "colors" objects with sensible values for every field.
- Match industry, tone, and language described in the brief.
- Contact fields: only include values explicitly stated in the brief, or copy exactly from "contact to preserve" when provided. Never invent names, emails, or phone numbers.
- If the brief describes a role without personal details (e.g. "law firm partner"), set jobTitle/company when appropriate but leave name/email/phone empty or omit them.
- Social URLs: only if provided in the brief; otherwise return empty strings for all social fields.
- Corporate/professional: restrained palette, Calibri or Segoe UI, moderate sizes.
- Creative/modern: bolder accent, clear hierarchy, still Outlook-safe.

JSON schema:
${AI_DESIGN_JSON_SCHEMA}`
  }

  return `You are an expert email signature designer for Microsoft Outlook HTML signatures.

Rules:
${SHARED_RULES}
- Refine the existing design described in the current form; keep contact details unless the brief asks to change them.
- Corporate/professional: restrained palette, Calibri or Segoe UI, moderate sizes.
- Creative/modern: bolder accent color, slightly larger name, optional wider signature.
- Do NOT invent personal contact data. Only fill contact fields explicitly given in the brief or current form.
- Keep social URLs empty unless provided in the brief or current form.

JSON schema:
${AI_DESIGN_JSON_SCHEMA}`
}

export const buildImageExtractionSystemPrompt = (): string => `You are an expert at reading email signature screenshots and converting them into structured Outlook signature form data.

Rules:
${SHARED_RULES}
- Extract visible contact details exactly as shown: name, job title, company, phone, email, website.
- Detect the signature language. Use "he" for Hebrew/RTL signatures and align text right.
- Preserve the uploaded image's colors as closely as possible. Sample the visible palette and return a full "colors" object: accentColor for the main brand/name/link color, secondaryTextColor for title/labels, dividerColor for separators, linkColor for website links, textColor for body text, and backgroundColor for the signature background.
- If a company logo is visible, infer only layout/color choices from it. Do not return image URLs.
- If social icons are visible but profile URLs are not visible, omit the "social" object so existing URLs can stay unchanged.
- Do not invent personal contact data or social URLs.
- Return complete "layout" and "colors" objects to recreate the uploaded signature style with the site's existing logo and icon controls.

JSON schema:
${AI_DESIGN_JSON_SCHEMA}`

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const pickString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const pickNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

const pickAlign = (value: unknown): TextAlign | undefined =>
  value === 'left' || value === 'center' || value === 'right' ? value : undefined

const pickVerticalAlign = (value: unknown): VerticalAlign | undefined =>
  value === 'top' || value === 'middle' || value === 'bottom' ? value : undefined

const pickLanguage = (value: unknown): AppLanguage | undefined =>
  value === 'en' || value === 'he' ? value : undefined

const pickHexColor = (value: unknown): string | undefined => {
  const raw = pickString(value)
  if (!raw) return undefined
  const normalized = raw.startsWith('#') ? raw : `#${raw}`
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : undefined
}

const pickFontFamily = (value: unknown): string | undefined => {
  const raw = pickString(value)
  if (!raw) return undefined
  if ((ALLOWED_FONT_FAMILIES as readonly string[]).includes(raw)) return raw
  const match = ALLOWED_FONT_FAMILIES.find(
    (font) => font.toLowerCase().includes(raw.toLowerCase()) || raw.toLowerCase().includes('arial')
  )
  return match
}

const extractJsonText = (raw: string): string => {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
  return trimmed
}

export const parseAiSignatureDesign = (raw: string): AiSignatureDesign => {
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonText(raw))
  } catch {
    throw new Error('AI returned invalid JSON')
  }

  if (!isRecord(parsed)) {
    throw new Error('AI response must be a JSON object')
  }

  const designSummary = pickString(parsed.designSummary)
  if (!designSummary) {
    throw new Error('AI response missing designSummary')
  }

  const result: AiSignatureDesign = { designSummary }

  if (isRecord(parsed.contact)) {
    result.contact = {
      signatureLanguage: pickLanguage(parsed.contact.signatureLanguage),
      fullName: pickString(parsed.contact.fullName),
      jobTitle: pickString(parsed.contact.jobTitle),
      company: pickString(parsed.contact.company),
      phone: pickString(parsed.contact.phone),
      email: pickString(parsed.contact.email),
      website: pickString(parsed.contact.website)
    }
  }

  if (isRecord(parsed.layout)) {
    result.layout = {
      fontFamily: pickFontFamily(parsed.layout.fontFamily),
      nameFontSize: pickNumber(parsed.layout.nameFontSize),
      titleFontSize: pickNumber(parsed.layout.titleFontSize),
      bodyFontSize: pickNumber(parsed.layout.bodyFontSize),
      lineSpacing: pickNumber(parsed.layout.lineSpacing),
      signatureWidth: pickNumber(parsed.layout.signatureWidth),
      signatureHeight: pickNumber(parsed.layout.signatureHeight),
      textColumnWidth: pickNumber(parsed.layout.textColumnWidth),
      logoMaxWidth: pickNumber(parsed.layout.logoMaxWidth),
      textAlign: pickAlign(parsed.layout.textAlign),
      nameTitleAlign: pickAlign(parsed.layout.nameTitleAlign),
      emailAlign: pickAlign(parsed.layout.emailAlign),
      logoAlign: pickAlign(parsed.layout.logoAlign),
      verticalAlign: pickVerticalAlign(parsed.layout.verticalAlign),
      textOffsetX: pickNumber(parsed.layout.textOffsetX),
      textOffsetY: pickNumber(parsed.layout.textOffsetY),
      logoOffsetX: pickNumber(parsed.layout.logoOffsetX),
      logoOffsetY: pickNumber(parsed.layout.logoOffsetY),
      dividerThickness: pickNumber(parsed.layout.dividerThickness),
      socialIconGap: pickNumber(parsed.layout.socialIconGap)
    }
  }

  if (isRecord(parsed.colors)) {
    result.colors = {
      accentColor: pickHexColor(parsed.colors.accentColor),
      textColor: pickHexColor(parsed.colors.textColor),
      secondaryTextColor: pickHexColor(parsed.colors.secondaryTextColor),
      dividerColor: pickHexColor(parsed.colors.dividerColor),
      linkColor: pickHexColor(parsed.colors.linkColor),
      backgroundColor: pickHexColor(parsed.colors.backgroundColor)
    }
  }

  if (isRecord(parsed.social)) {
    result.social = {
      facebookUrl: pickString(parsed.social.facebookUrl),
      instagramUrl: pickString(parsed.social.instagramUrl),
      linkedinUrl: pickString(parsed.social.linkedinUrl),
      xUrl: pickString(parsed.social.xUrl),
      youtubeUrl: pickString(parsed.social.youtubeUrl)
    }
  }

  return result
}

export type AiUserPromptOptions = {
  mode?: AiDesignMode
  keepContact?: boolean
}

export const buildAiUserPrompt = (
  brief: string,
  snapshot: SignatureFormSnapshot,
  options: AiUserPromptOptions = {}
): string => {
  const mode = options.mode ?? 'refine'
  const keepContact = options.keepContact ?? true

  if (mode === 'create') {
    const contactNote = keepContact
      ? `Contact to preserve exactly (do not change unless the brief overrides):\n${JSON.stringify(
          {
            signatureLanguage: snapshot.signatureLanguage,
            fullName: snapshot.fullName,
            jobTitle: snapshot.jobTitle,
            company: snapshot.company,
            phone: snapshot.phone,
            email: snapshot.email,
            website: snapshot.website
          },
          null,
          2
        )}`
      : 'No existing contact to preserve ΓÇö only use contact details explicitly written in the brief.'

    return `Create a brand NEW Outlook email signature from scratch.

Brief:
"""
${brief.trim()}
"""

${contactNote}

Design everything fresh (layout, colors, typography). Return the JSON design object only.`
  }

  return `Refine an existing Outlook email signature from this brief:

"""
${brief.trim()}
"""

Current form (use as context; do not overwrite contact/social unless the brief asks to):
${JSON.stringify(snapshot, null, 2)}

Return the JSON design object only.`
}
