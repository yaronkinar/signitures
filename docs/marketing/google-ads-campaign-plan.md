# Google Ads campaign plan — Outlook Signature Generator (signitures.dev)

**Date:** 2026-06-29
**Product:** signitures.dev — design Outlook/Outlook-Web email signatures, AI design assistant, bulk Excel-driven generation for whole teams, free design + paid export (Pro $29/mo per company domain, or $1.99 pay-per-download).
**Goal:** Drive qualified signups from people setting up email signatures for themselves or their company, optimizing for Pro subscription conversions (admins/IT/marketing buying for a whole domain) and pay-per-download conversions (individuals).

## 1. Audience & positioning

Two buyer types, two messages:

| Segment | Intent | Message |
|---|---|---|
| Individual professional / freelancer | "I need a signature now" | Fast, free, no design skill needed |
| IT admin / office manager / marketing lead at a company | "Standardize signatures across N employees" | Bulk generation from Excel, brand consistency, one purchase covers the whole team |

Lead with the bulk/brand-consistency angle for Search (higher intent, higher LTV); use the individual angle for broader reach.

## 2. Campaign structure

```
Campaign: Signitures – Search – Brand Consistency (B2B)
  Ad Group: Bulk Signature Generation
  Ad Group: Outlook Signature for Company / Team

Campaign: Signitures – Search – Individual Signature
  Ad Group: Outlook Signature Generator
  Ad Group: Email Signature Maker / Templates

Campaign: Signitures – Search – Branded (own name)
  Ad Group: Signitures Brand
```

Separate brand campaign protects against competitor bidding on "signitures" and keeps CPC low; never mix brand and non-brand spend/budget reporting.

Bidding: start with **Maximize Conversions**, switch to **Target CPA** once ~30 conversions/campaign have accumulated. Track two conversion actions separately (Pro checkout started, pay-per-download checkout started) so Smart Bidding doesn't conflate a $1.99 sale with a $29/mo subscription.

## 3. Keywords

**Ad Group: Bulk Signature Generation** (Phrase + Exact)
- "bulk email signature generator"
- "company wide email signature"
- "email signature generator for employees"
- "outlook signature for all employees"
- "email signature from excel"
- "standardize email signatures"

**Ad Group: Outlook Signature for Company / Team**
- "email signature for company"
- "corporate email signature generator"
- "consistent email signatures team"
- "email signature management tool"

**Ad Group: Outlook Signature Generator**
- "outlook signature generator"
- "outlook email signature maker"
- "create outlook signature"
- "outlook signature design"
- "new outlook signature generator"

**Ad Group: Email Signature Maker / Templates**
- "email signature maker"
- "email signature template"
- "free email signature generator"
- "professional email signature"
- "html email signature generator"

**Negative keywords (all campaigns):** gmail, apple mail, thunderbird, digital signature, electronic signature, docusign, e-signature, signature loan, signature pad, jobs, career, free download crack.

(Negatives matter here — "signature generator" and "digital/e-signature" intent are completely different products and will burn budget fast.)

## 4. Responsive Search Ads — copy

### Headlines (mix across pinned/unpinned, 15 max per ad, ≤30 characters each — Google's RSA headline limit)
1. Outlook Signature Generator (27)
2. Free to Design, Pay to Export (29)
3. AI-Designed Email Signatures (28)
4. Bulk Signatures From Excel (26)
5. One Click, Whole Team Branded (29)
6. No Design Skills Needed (23)
7. Outlook & New Outlook Ready (27)
8. One Signature, Every Employee (29)
9. Build a Signature in Minutes (28)
10. Pay $1.99, No Subscription (26)
11. Go Pro: Unlimited Team Exports (30)
12. Try It Free, No Signup Needed (29)
13. Signature Designer for Outlook (30)
14. On-Brand Email Signatures (25)
15. Generate 100s of Signatures (27)

### Descriptions (4 max per ad, ≤90 characters each — Google's RSA description limit)

Generic set (use for the Brand campaign, or as a fallback):
1. Design free in Outlook. Pay only to export — $1.99 once, or $29/mo Pro for your team. (86)
2. Upload an Excel list, generate every employee's signature in one pass. For IT admins. (87)
3. AI Design Assistant helps you get a polished, on-brand signature without a designer. (84)
4. Works with classic and new Outlook. Export, install, or download as PNG. (72)

**Per-ad-group sets** (tailor each RSA's descriptions to its ad group instead of reusing the generic set):

*Bulk Signature Generation*
1. Generate every employee's signature from one Excel file, in minutes. (68)
2. No more chasing employees for info — import once, generate for everyone. (72)
3. One Pro plan unlocks unlimited exports for your whole company domain. (69)
4. AI Design Assistant keeps every signature on-brand, automatically. (66)

*Outlook Signature for Company / Team*
1. Give every employee a consistent, on-brand Outlook signature today. (67)
2. No design team needed — pick a template, brand it, roll it out fast. (68)
3. $29/mo Pro covers unlimited exports for your entire company domain. (67)
4. Works with classic Outlook and the new Outlook — no IT setup needed. (68)

*Outlook Signature Generator (individual)*
1. Design a free Outlook signature in minutes, no design skills needed. (68)
2. AI Design Assistant builds a polished signature from a short brief. (67)
3. Export once for $1.99, or download as HTML, PNG, or install directly. (70)
4. Free to design and preview — no signup needed until you export. (63)

*Email Signature Maker / Templates*
1. Browse signature templates and customize colors, fonts, and layout free. (72)
2. Add social icons, photos, and disclaimers to your email signature. (66)
3. Download as HTML or PNG, or install directly into Outlook. (58)
4. Pay just $1.99 to export — no subscription required for individuals. (68)

*Signitures Brand*
1. The official Signitures Outlook signature generator and design tool. (68)
2. Design your signature free, export for $1.99 or go Pro for your team. (69)
3. AI Design Assistant, bulk Excel import, and cloud save, all in Pro. (67)
4. The signature builder trusted by individuals and growing companies. (67)

### Sitelink extensions
- "Bulk Signature Generator" → landing on bulk/Excel feature
- "AI Design Assistant" → AI feature
- "Pricing" → pricing/Pro page
- "Install to Outlook" → install guide

### Callout extensions
- Free to design
- No credit card to start
- AI-assisted design
- Bulk Excel import
- Works with new Outlook

### Structured snippets
- Types: Email signatures, Bulk import, AI design, Outlook & New Outlook

## 5. Landing pages

- Non-brand individual + brand campaigns → homepage (`/`) — it already supports full anonymous design with no login wall, so traffic lands directly in the product.
- Bulk/B2B ad group → ideally a dedicated landing section anchored on the bulk-generation feature (if/when one exists); until then, point to `/` since the designer is reachable with no friction and bulk generation is a visible panel in-app.

Do not point ads at any page that requires sign-in before letting the visitor see the product — the existing monetization design (`docs/superpowers/specs/2026-06-20-monetization-payments-design.md`) keeps the designer open to anonymous visitors specifically so ad/SEO traffic isn't lost to a login wall; ad copy and landing pages should lean into that ("free to design, no signup to start").

## 6. Conversion tracking (not yet implemented)

Two distinct conversion actions are needed in Google Ads / GA4 before launch:
1. **Pro checkout started/completed** (high value — $29/mo)
2. **Pay-per-download checkout started/completed** (lower value — $1.99)

These map to the Lemon Squeezy checkout flow described in the monetization design doc. Implementing the actual `gtag('event', 'conversion', ...)` calls at the checkout-start and checkout-success points (`PaywallModal.tsx`, the Lemon.js overlay success callback) is a separate, code-level task — flagged here so it isn't forgotten before spend ramps up, since campaigns without conversion tracking can't use Smart Bidding effectively.

## 7. Budget & rollout

- Phase 1 (2 weeks): Brand + "Outlook Signature Generator" ad group only, $20–30/day, Maximize Clicks, to validate landing page CTR and confirm tracking fires correctly.
- Phase 2 (once conversion tracking is live): Add bulk/B2B ad group, switch to Maximize Conversions, raise budget to $50–75/day, split spend ~60% non-brand / 40% bulk-B2B given higher LTV of Pro signups.
- Review weekly: pause keywords with >$15 spend and 0 conversions; promote winning search terms from Search Terms report into exact-match keywords.

## 8. Open items before launch

- [ ] Set up conversion actions in Google Ads + GA4 and wire `gtag` events at checkout start/success (code change, not covered by this doc).
- [ ] Confirm `signitures.dev` has Google Ads' required policy pages (Privacy Policy, Terms) linked in the footer — required for billing-related ad approval.
- [ ] Decide final daily budget and who owns the Google Ads account billing.
