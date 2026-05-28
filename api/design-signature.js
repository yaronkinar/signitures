"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api-src/design-signature.ts
var design_signature_exports = {};
__export(design_signature_exports, {
  default: () => handler
});
module.exports = __toCommonJS(design_signature_exports);

// lib/aiSignatureDesign.ts
var ALLOWED_FONT_FAMILIES = [
  "'Rubik', Arial, Helvetica, sans-serif",
  "'Cairo', Arial, Helvetica, sans-serif",
  "Arial, Helvetica, sans-serif",
  "'Comeback SemiBold', 'Comeback Semi', Comeback, Arial, Helvetica, sans-serif",
  "'Calibri', Arial, Helvetica, sans-serif",
  "'Segoe UI', Arial, Helvetica, sans-serif",
  "'Tahoma', Arial, Helvetica, sans-serif",
  "'Verdana', Arial, Helvetica, sans-serif",
  "'Trebuchet MS', Arial, Helvetica, sans-serif",
  "'Times New Roman', Times, serif",
  "'Georgia', serif"
];
var AI_DESIGN_JSON_SCHEMA = `{
  "designSummary": "string \u0393\xC7\xF6 1-2 sentences explaining the design choices",
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
    "nameFontWeight": "300 | 400 | 500 | 600 | 700 | 800",
    "titleFontWeight": "300 | 400 | 500 | 600 | 700 | 800",
    "bodyFontWeight": "300 | 400 | 500 | 600 | 700 | 800",
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
}`;
var SHARED_RULES = `- Return ONLY valid JSON matching the schema. No markdown fences or commentary.
- Optimize for Outlook: table-based layout, web-safe fonts, readable contrast (WCAG AA).
- Hebrew/RTL: set signatureLanguage to "he", align text right, prefer Tahoma or Arial.
- Colors must be 6-digit hex (#RRGGBB).
- fontFamily must be exactly one of:
${ALLOWED_FONT_FAMILIES.map((f) => `  - ${f}`).join("\n")}`;
var buildAiSystemPrompt = (mode = "refine") => {
  if (mode === "create") {
    return `You are an expert email signature designer for Microsoft Outlook HTML signatures.

You are creating a BRAND NEW signature from scratch based on the user's brief. Do not copy or tweak an old design \u0393\xC7\xF6 invent a cohesive layout, typography scale, and color palette that fits the brief.

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
${AI_DESIGN_JSON_SCHEMA}`;
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
${AI_DESIGN_JSON_SCHEMA}`;
};
var buildImageExtractionSystemPrompt = () => `You are an expert at reading email signature screenshots and converting them into structured Outlook signature form data.

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
${AI_DESIGN_JSON_SCHEMA}`;
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var pickString = (value) => typeof value === "string" && value.trim() ? value.trim() : void 0;
var pickNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return void 0;
};
var pickAlign = (value) => value === "left" || value === "center" || value === "right" ? value : void 0;
var pickVerticalAlign = (value) => value === "top" || value === "middle" || value === "bottom" ? value : void 0;
var pickLanguage = (value) => value === "en" || value === "he" ? value : void 0;
var pickHexColor = (value) => {
  const raw = pickString(value);
  if (!raw) return void 0;
  const normalized = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : void 0;
};
var pickFontFamily = (value) => {
  const raw = pickString(value);
  if (!raw) return void 0;
  if (ALLOWED_FONT_FAMILIES.includes(raw)) return raw;
  const match = ALLOWED_FONT_FAMILIES.find(
    (font) => font.toLowerCase().includes(raw.toLowerCase()) || raw.toLowerCase().includes("arial")
  );
  return match;
};
var extractJsonText = (raw) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
};
var parseAiSignatureDesign = (raw) => {
  let parsed;
  try {
    parsed = JSON.parse(extractJsonText(raw));
  } catch {
    throw new Error("AI returned invalid JSON");
  }
  if (!isRecord(parsed)) {
    throw new Error("AI response must be a JSON object");
  }
  const designSummary = pickString(parsed.designSummary);
  if (!designSummary) {
    throw new Error("AI response missing designSummary");
  }
  const result = { designSummary };
  if (isRecord(parsed.contact)) {
    result.contact = {
      signatureLanguage: pickLanguage(parsed.contact.signatureLanguage),
      fullName: pickString(parsed.contact.fullName),
      jobTitle: pickString(parsed.contact.jobTitle),
      company: pickString(parsed.contact.company),
      phone: pickString(parsed.contact.phone),
      email: pickString(parsed.contact.email),
      website: pickString(parsed.contact.website)
    };
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
    };
  }
  if (isRecord(parsed.colors)) {
    result.colors = {
      accentColor: pickHexColor(parsed.colors.accentColor),
      textColor: pickHexColor(parsed.colors.textColor),
      secondaryTextColor: pickHexColor(parsed.colors.secondaryTextColor),
      dividerColor: pickHexColor(parsed.colors.dividerColor),
      linkColor: pickHexColor(parsed.colors.linkColor),
      backgroundColor: pickHexColor(parsed.colors.backgroundColor)
    };
  }
  if (isRecord(parsed.social)) {
    result.social = {
      facebookUrl: pickString(parsed.social.facebookUrl),
      instagramUrl: pickString(parsed.social.instagramUrl),
      linkedinUrl: pickString(parsed.social.linkedinUrl),
      xUrl: pickString(parsed.social.xUrl),
      youtubeUrl: pickString(parsed.social.youtubeUrl)
    };
  }
  return result;
};
var buildAiUserPrompt = (brief, snapshot, options = {}) => {
  const mode = options.mode ?? "refine";
  const keepContact = options.keepContact ?? true;
  if (mode === "create") {
    const contactNote = keepContact ? `Contact to preserve exactly (do not change unless the brief overrides):
${JSON.stringify(
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
    )}` : "No existing contact to preserve \u0393\xC7\xF6 only use contact details explicitly written in the brief.";
    return `Create a brand NEW Outlook email signature from scratch.

Brief:
"""
${brief.trim()}
"""

${contactNote}

Design everything fresh (layout, colors, typography). Return the JSON design object only.`;
  }
  return `Refine an existing Outlook email signature from this brief:

"""
${brief.trim()}
"""

Current form (use as context; do not overwrite contact/social unless the brief asks to):
${JSON.stringify(snapshot, null, 2)}

Return the JSON design object only.`;
};

// api-src/design-signature.ts
var DEFAULT_BASE_URL = "https://api.openai.com/v1";
var DEFAULT_MODEL = "gpt-4o-mini";
var IMAGE_EXTRACTION_BRIEF = "Extract the contact details and visual style from this uploaded email signature image. Preserve the visible colors as closely as possible and fill the signature form so the site can recreate it as editable Outlook HTML.";
var normalizeApiKey = (value) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.replace(/^['"]|['"]$/g, "");
};
var getServerApiKey = () => normalizeApiKey(process.env.OPENAI_API_KEY) || normalizeApiKey(process.env.VITE_OPENAI_API_KEY);
var parseJsonBody = (body) => {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return body;
  }
  if (typeof body === "string" && body.trim()) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
    }
  }
  return {};
};
async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.status(200).json({
        ok: true,
        hasApiKey: Boolean(getServerApiKey()),
        model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL
      });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const apiKey = getServerApiKey();
    if (!apiKey) {
      res.status(500).json({
        error: "OPENAI_API_KEY is not set on the server. In Vercel: Settings \u2192 Environment Variables \u2192 add OPENAI_API_KEY for Production, then redeploy."
      });
      return;
    }
    const body = parseJsonBody(req.body);
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl.trim() : "";
    const brief = typeof body.brief === "string" ? body.brief.trim() : "";
    const snapshot = body.snapshot;
    const mode = body.mode === "create" ? "create" : "refine";
    const keepContact = body.keepContact !== false;
    if (!imageDataUrl && (!brief || !snapshot || typeof snapshot !== "object")) {
      res.status(400).json({ error: "Missing brief or snapshot" });
      return;
    }
    const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
    const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
    const messages = imageDataUrl ? [
      { role: "system", content: buildImageExtractionSystemPrompt() },
      {
        role: "user",
        content: [
          { type: "text", text: IMAGE_EXTRACTION_BRIEF },
          { type: "image_url", image_url: { url: imageDataUrl } }
        ]
      }
    ] : [
      { role: "system", content: buildAiSystemPrompt(mode) },
      {
        role: "user",
        content: buildAiUserPrompt(brief, snapshot, { mode, keepContact })
      }
    ];
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: imageDataUrl ? 0.2 : mode === "create" ? 0.55 : 0.4,
        response_format: { type: "json_object" },
        messages
      })
    });
    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errorBody = await response.json();
        detail = errorBody.error?.message ?? detail;
      } catch {
      }
      res.status(response.status).json({ error: detail || `OpenAI API error ${response.status}` });
      return;
    }
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      res.status(502).json({ error: "Empty response from AI" });
      return;
    }
    const design = parseAiSignatureDesign(content);
    res.status(200).json({ design });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    console.error("[design-signature]", message, error);
    res.status(500).json({ error: message });
  }
}
module.exports = module.exports.default ?? module.exports;
