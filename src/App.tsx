import { useCallback, useState } from 'react'
import { SBA_BRAND_COLORS, SBA_BRAND_PRESETS } from './brandPresets'
import { BulkSignaturesPanel } from './components/BulkSignaturesPanel'
import { Field, SelectInput, TextInput } from './components/Field'
import { ColorInput } from './components/ColorInput'
import { Panel } from './components/Panel'
import { Toaster } from './components/Toaster'
import { StyleSummary } from './components/StyleSummary'
import { UpdatePrompt } from './components/UpdatePrompt'
import { useSignatureApp } from './hooks/useSignatureApp'
import { outlookHelpStatusHtml, t, type AppLanguage } from './i18n'
import {
  getBundledFontCssFamily,
  googleFontDownloadUrl,
  isBundledWebFont
} from './lib/signatureFonts'
import { normalizeSocialIconVariant, type SocialPlatform } from './lib/socialIconCatalog'
import { fileToDataUrl } from './lib/signatureUtils'
import { SocialIconVariantPicker } from './components/SocialIconVariantPicker'
import type { SignatureFormState, TextAlign } from './types/signatureForm'

const FONT_OPTIONS = [
  { value: "'Rubik', Arial, Helvetica, sans-serif", label: 'Rubik' },
  { value: "'Cairo', Arial, Helvetica, sans-serif", label: 'Cairo' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  {
    value: "'Comeback SemiBold', 'Comeback Semi', Comeback, Arial, Helvetica, sans-serif",
    label: 'Comeback SemiBold'
  },
  { value: "'Calibri', Arial, Helvetica, sans-serif", label: 'Calibri' },
  { value: "'Segoe UI', Arial, Helvetica, sans-serif", label: 'Segoe UI' },
  { value: "'Tahoma', Arial, Helvetica, sans-serif", label: 'Tahoma' },
  { value: "'Verdana', Arial, Helvetica, sans-serif", label: 'Verdana' },
  { value: "'Trebuchet MS', Arial, Helvetica, sans-serif", label: 'Trebuchet MS' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: "'Georgia', serif", label: 'Georgia' }
] as const

const FONT_WEIGHT_OPTIONS = [
  { value: 300, label: 'Light 300' },
  { value: 400, label: 'Regular 400' },
  { value: 500, label: 'Medium 500' },
  { value: 600, label: 'SemiBold 600' },
  { value: 700, label: 'Bold 700' },
  { value: 800, label: 'ExtraBold 800' }
] as const

const SOCIAL_NETWORKS = [
  {
    name: 'Facebook',
    platform: 'Facebook',
    urlKey: 'facebookUrl',
    iconUrlKey: 'facebookIconUrl',
    iconVariantKey: 'facebookIconVariant',
    iconFileKey: 'facebookIconFile'
  },
  {
    name: 'Instagram',
    platform: 'Instagram',
    urlKey: 'instagramUrl',
    iconUrlKey: 'instagramIconUrl',
    iconVariantKey: 'instagramIconVariant',
    iconFileKey: 'instagramIconFile'
  },
  {
    name: 'LinkedIn',
    platform: 'LinkedIn',
    urlKey: 'linkedinUrl',
    iconUrlKey: 'linkedinIconUrl',
    iconVariantKey: 'linkedinIconVariant',
    iconFileKey: 'linkedinIconFile'
  },
  {
    name: 'X / Twitter',
    platform: 'X',
    urlKey: 'xUrl',
    iconUrlKey: 'xIconUrl',
    iconVariantKey: 'xIconVariant',
    iconFileKey: 'xIconFile'
  },
  {
    name: 'YouTube',
    platform: 'YouTube',
    urlKey: 'youtubeUrl',
    iconUrlKey: 'youtubeIconUrl',
    iconVariantKey: 'youtubeIconVariant',
    iconFileKey: 'youtubeIconFile'
  }
] as const satisfies ReadonlyArray<{
  name: string
  platform: SocialPlatform
  urlKey: keyof SignatureFormState
  iconUrlKey: keyof SignatureFormState
  iconVariantKey: keyof SignatureFormState
  iconFileKey: keyof SignatureFormState
}>

const PlacementControl = ({
  value,
  min,
  max,
  onChange
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) => (
  <div className="placement-control">
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
)

const PreviewBox = ({
  html,
  width,
  minHeight
}: {
  html: string
  width: number
  minHeight: number
}) => (
  <div
    className="preview"
    style={{ width: `${width}px`, minHeight: `${minHeight}px`, height: 'auto' }}
    dangerouslySetInnerHTML={{ __html: html }}
  />
)

const OutlookPreviewPane = ({
  html,
  width,
  minHeight,
  emailAlign,
  lang
}: {
  html: string
  width: number
  minHeight: number
  emailAlign: TextAlign
  lang: AppLanguage
}) => (
  <div className="outlook-preview" aria-label={t(lang, 'preview')}>
    <div className="outlook-preview-window">
      <div className="outlook-preview-titlebar">{t(lang, 'outlookPreviewTitle')}</div>
      <div className="outlook-preview-compose">
        <div className="outlook-preview-field">
          <span className="outlook-preview-field-label">{t(lang, 'outlookPreviewTo')}</span>
        </div>
        <div
          className="outlook-preview-body"
          style={{ textAlign: emailAlign }}
          dir="ltr"
        >
          <p className="outlook-preview-placeholder">{t(lang, 'outlookPreviewPlaceholder')}</p>
          <div
            className="preview outlook-preview-signature"
            style={{
              width: `${width}px`,
              minHeight: `${minHeight}px`,
              height: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  </div>
)

export default function App() {
  const app = useSignatureApp()
  const { form, updateForm, lang } = app
  const [aiPresetId, setAiPresetId] = useState('')
  const [brandPresetId, setBrandPresetId] = useState('')
  const [signatureImageFile, setSignatureImageFile] = useState<File | undefined>()

  const alignOptions = [
    { value: 'left', label: t(lang, 'alignLeft') },
    { value: 'center', label: t(lang, 'alignCenter') },
    { value: 'right', label: t(lang, 'alignRight') }
  ] as const

  const verticalAlignOptions = [
    { value: 'top', label: t(lang, 'alignTop') },
    { value: 'middle', label: t(lang, 'alignMiddle') },
    { value: 'bottom', label: t(lang, 'alignBottom') }
  ] as const

  const logoSideOptions = [
    { value: 'left', label: t(lang, 'logoSideLeft') },
    { value: 'right', label: t(lang, 'logoSideRight') }
  ] as const

  const bundledFontName = getBundledFontCssFamily(form.fontFamily)
  const bundledFontDownloadUrl = googleFontDownloadUrl(form.fontFamily)
  const showOutlookFontNotice = isBundledWebFont(form.fontFamily)

  const onOutlookHelpClick = useCallback(
    (event: React.MouseEvent<HTMLParagraphElement>) => {
      const target = (event.target as HTMLElement).closest('.open-signatures-folder')
      if (target) {
        event.preventDefault()
        app.handleOpenSignaturesFolder()
      }
    },
    [app]
  )

  const applyPreset = (presetId: string) => {
    if (presetId) app.applyAiPreset(presetId)
    setAiPresetId('')
  }

  const applyBrandPreset = (presetId: string) => {
    const preset = SBA_BRAND_PRESETS.find((item) => item.id === presetId)
    if (preset) updateForm(preset.values, { immediate: true })
    setBrandPresetId('')
  }

  const aiStatusClass =
    app.aiStatusTone === 'success'
      ? 'ai-status is-success'
      : app.aiStatusTone === 'error'
        ? 'ai-status is-error'
        : 'ai-status'
  const imageImportStatusClass =
    app.imageImportStatusTone === 'success'
      ? 'ai-status is-success'
      : app.imageImportStatusTone === 'error'
        ? 'ai-status is-error'
        : 'ai-status'

  return (
    <main className="page">
      <div className="workspace">
      <section className="card card-editor">
        <div className="card-header">
          <div className="card-header-row">
            <div>
              <h1>{t(lang, 'pageHeading')}</h1>
              <p className="lead">{t(lang, 'pageLead')}</p>
            </div>
            <div className="form-storage-bar">
              <div className="history-controls" role="group" aria-label={t(lang, 'undo')}>
                <button
                  type="button"
                  className="btn-undo"
                  disabled={!app.canUndo}
                  title={t(lang, 'undoShortcut')}
                  onClick={app.undo}
                >
                  {t(lang, 'undo')}
                </button>
                <button
                  type="button"
                  className="btn-redo"
                  disabled={!app.canRedo}
                  title={t(lang, 'redoShortcut')}
                  onClick={app.redo}
                >
                  {t(lang, 'redo')}
                </button>
              </div>
              <button type="button" className="btn-export" onClick={app.handleExportParams}>
                {t(lang, 'exportParams')}
              </button>
              <button type="button" className="btn-export-style" onClick={app.handleExportStyle}>
                {t(lang, 'exportStyle')}
              </button>
              <label className="params-import-label">
                <span className="btn-import params-import-button">{t(lang, 'importParams')}</span>
                <input
                  type="file"
                  accept=".json,.zip,application/json,application/zip"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    app.handleImportParams(file).catch(() => undefined)
                    event.target.value = ''
                  }}
                />
              </label>
              <button type="button" className="btn-reset" onClick={app.resetFormToDefaults}>
                {t(lang, 'resetForm')}
              </button>
            </div>
          </div>
        </div>

        <div className="panels">
          <Panel
            className="ai-panel"
            defaultOpen
            summary={t(lang, 'aiDesignAssistant')}
          >
            <p className="hint">
              {app.aiMode === 'create' ? t(lang, 'aiCreateLead') : t(lang, 'aiDesignLead')}
            </p>
            <div className="ai-mode" role="radiogroup" aria-label="AI mode">
              <label>
                <input
                  type="radio"
                  name="aiMode"
                  checked={app.aiMode === 'refine'}
                  onChange={() => app.setAiMode('refine')}
                />
                <span>{t(lang, 'aiModeRefine')}</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="aiMode"
                  checked={app.aiMode === 'create'}
                  onChange={() => app.setAiMode('create')}
                />
                <span>{t(lang, 'aiModeCreate')}</span>
              </label>
            </div>
            {app.aiMode === 'create' && (
              <label className="ai-keep-contact">
                <input
                  type="checkbox"
                  checked={app.aiKeepContact}
                  onChange={(e) => app.setAiKeepContact(e.target.checked)}
                />
                <span>{t(lang, 'aiKeepContact')}</span>
              </label>
            )}
            <label className="ai-preset-label">
              <span>
                {app.aiMode === 'create'
                  ? t(lang, 'aiCreatePresetLabel')
                  : t(lang, 'aiPresetLabel')}
              </span>
              <select value={aiPresetId} onChange={(e) => applyPreset(e.target.value)}>
                <option value="">{t(lang, 'aiPresetPlaceholder')}</option>
                {app.aiPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className="ai-brief"
              value={app.aiBrief}
              onChange={(e) => app.setAiBrief(e.target.value)}
              placeholder={
                app.aiMode === 'create'
                  ? t(lang, 'aiCreateBriefPlaceholder')
                  : t(lang, 'aiBriefPlaceholder')
              }
            />
            <Field label={t(lang, 'aiApiKeyLabel')} className="ai-api-key" style={{ display: 'block', marginTop: 10 }}>
              <input
                type="password"
                autoComplete="off"
                value={app.aiApiKey}
                placeholder={app.apiKeyPlaceholder}
                onChange={(e) => app.setAiApiKey(e.target.value)}
              />
            </Field>
            <div className="ai-actions">
              <button
                type="button"
                className="primary"
                disabled={app.aiWorking}
                onClick={() => app.runAiDesign('refine')}
              >
                {t(lang, 'aiDesignButton')}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={app.aiWorking}
                onClick={() => app.runAiDesign('create')}
              >
                {t(lang, 'aiCreateNewButton')}
              </button>
            </div>
            {app.aiStatus && <p className={aiStatusClass}>{app.aiStatus}</p>}
            {app.showAiPreview && app.outputHtml && (
              <div className="ai-preview-wrap">
                <p className="hint">{t(lang, 'aiSignaturePreview')}</p>
                <div className="preview-frame">
                  <PreviewBox
                    html={app.outputHtml}
                    width={app.layout.signatureWidth}
                    minHeight={app.layout.signatureHeight}
                  />
                </div>
              </div>
            )}
          </Panel>

          <Panel defaultOpen summary={t(lang, 'imageImport')}>
            <p className="hint">{t(lang, 'imageImportLead')}</p>
            <div className="image-import-actions">
              <Field label={t(lang, 'imageImportFile')}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setSignatureImageFile(e.target.files?.[0])}
                />
              </Field>
              <button
                type="button"
                className="primary"
                disabled={!signatureImageFile || app.imageImportWorking}
                onClick={() => app.runImageImport(signatureImageFile)}
              >
                {t(lang, 'imageImportButton')}
              </button>
            </div>
            {app.imageImportStatus && <p className={imageImportStatusClass}>{app.imageImportStatus}</p>}
          </Panel>

          <Panel defaultOpen summary={t(lang, 'contactDetails')}>
            <div className="grid">
              <Field label={t(lang, 'language')}>
                <SelectInput
                  value={form.signatureLanguage}
                  onChange={(e) => app.handleLanguageChange(e.target.value as typeof form.signatureLanguage)}
                >
                  <option value="en">{t(lang, 'langEnglish')}</option>
                  <option value="he">{t(lang, 'langHebrew')}</option>
                </SelectInput>
              </Field>
              <Field label={t(lang, 'fullName')}>
                <TextInput
                  value={form.fullName}
                  placeholder={t(lang, 'fullNamePlaceholder')}
                  onChange={(e) => updateForm({ fullName: e.target.value })}
                />
              </Field>
              <Field label={t(lang, 'jobTitle')}>
                <TextInput
                  value={form.jobTitle}
                  placeholder={t(lang, 'jobTitlePlaceholder')}
                  onChange={(e) => updateForm({ jobTitle: e.target.value })}
                />
              </Field>
              <Field label={t(lang, 'company')}>
                <TextInput
                  value={form.company}
                  placeholder={t(lang, 'companyPlaceholder')}
                  onChange={(e) => updateForm({ company: e.target.value })}
                />
              </Field>
              <Field label={t(lang, 'phone')}>
                <TextInput
                  value={form.phone}
                  placeholder={t(lang, 'phonePlaceholder')}
                  onChange={(e) => updateForm({ phone: e.target.value })}
                />
              </Field>
              <Field label={t(lang, 'email')}>
                <TextInput
                  value={form.email}
                  placeholder={t(lang, 'emailPlaceholder')}
                  onChange={(e) => updateForm({ email: e.target.value })}
                />
              </Field>
              <Field label={t(lang, 'website')}>
                <TextInput
                  value={form.website}
                  placeholder={t(lang, 'websitePlaceholder')}
                  onChange={(e) => updateForm({ website: e.target.value })}
                />
              </Field>
            </div>
          </Panel>

          <BulkSignaturesPanel template={form} lang={lang} />

          <Panel summary={t(lang, 'logoBanner')}>
            <p className="hint">{t(lang, 'logoBannerHint')}</p>
            <div className="grid">
              <Field label={t(lang, 'logoUrl')}>
                <TextInput
                  value={form.logoUrl}
                  placeholder={t(lang, 'urlPlaceholder')}
                  onChange={(e) => updateForm({ logoUrl: e.target.value })}
                />
              </Field>
              <Field label={t(lang, 'logoFile')}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => app.handleFileToField(e.target.files?.[0], 'logoUrl')}
                />
              </Field>
            </div>
            <details className="sub-panel" open>
              <summary>{t(lang, 'logoPlacement')}</summary>
              <div className="sub-panel-body">
                <p className="hint">{t(lang, 'logoPlacementHint')}</p>
                <div className="placement-subsection">
                  <h4>{t(lang, 'logoPlacementHorizontal')}</h4>
                  <div className="grid">
                    <Field label={t(lang, 'logoSide')}>
                      <SelectInput
                        value={form.logoSide}
                        onChange={(e) =>
                          updateForm({
                            logoSide: e.target.value as SignatureFormState['logoSide']
                          })
                        }
                      >
                        {logoSideOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label={t(lang, 'logoAlign')}>
                      <SelectInput
                        value={form.logoAlign}
                        onChange={(e) =>
                          updateForm({
                            logoAlign: e.target.value as SignatureFormState['logoAlign']
                          })
                        }
                      >
                        {alignOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label={t(lang, 'logoMaxWidth')}>
                      <input
                        type="number"
                        min={60}
                        max={400}
                        value={form.logoMaxWidth}
                        onChange={(e) => updateForm({ logoMaxWidth: Number(e.target.value) })}
                      />
                    </Field>
                    <Field
                      label={t(lang, 'logoHorizontalPlacement')}
                      hint={t(lang, 'logoHorizontalPlacementHint')}
                    >
                      <PlacementControl
                        min={-120}
                        max={120}
                        value={form.logoOffsetX}
                        onChange={(logoOffsetX) => updateForm({ logoOffsetX })}
                      />
                    </Field>
                  </div>
                </div>
                <div className="placement-subsection">
                  <h4>{t(lang, 'logoPlacementVertical')}</h4>
                  <div className="grid">
                    <Field label={t(lang, 'verticalAlign')}>
                      <SelectInput
                        value={form.verticalAlign}
                        onChange={(e) =>
                          updateForm({
                            verticalAlign: e.target.value as SignatureFormState['verticalAlign']
                          })
                        }
                      >
                        {verticalAlignOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field
                      label={t(lang, 'logoVerticalPlacement')}
                      hint={t(lang, 'logoVerticalPlacementHint')}
                    >
                      <PlacementControl
                        min={-120}
                        max={120}
                        value={form.logoOffsetY}
                        onChange={(logoOffsetY) => updateForm({ logoOffsetY })}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </details>
            <div className="grid">
              <Field label={t(lang, 'bannerUrl')}>
                <TextInput
                  value={form.bannerUrl}
                  placeholder={t(lang, 'urlPlaceholder')}
                  onChange={(e) => updateForm({ bannerUrl: e.target.value })}
                />
              </Field>
              <Field label={t(lang, 'bannerFile')}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => app.handleFileToField(e.target.files?.[0], 'bannerUrl')}
                />
              </Field>
              <Field label={t(lang, 'bannerLink')}>
                <TextInput
                  value={form.bannerLink}
                  placeholder={t(lang, 'urlPlaceholder')}
                  onChange={(e) => updateForm({ bannerLink: e.target.value })}
                />
              </Field>
            </div>
          </Panel>

          <Panel defaultOpen summary={t(lang, 'socialMedia')}>
            <p className="hint">{t(lang, 'socialMediaHint')}</p>
            <p className="hint">{t(lang, 'socialIconVariantExpandHint')}</p>
            {SOCIAL_NETWORKS.map((network) => (
              <details
                key={network.name}
                className="sub-panel"
                open={network.platform === 'Instagram'}
              >
                <summary>{network.name}</summary>
                <div className="sub-panel-body grid-compact">
                  <Field label={t(lang, 'profileUrl')}>
                    <TextInput
                      value={String(form[network.urlKey])}
                      onChange={(e) => updateForm({ [network.urlKey]: e.target.value })}
                    />
                  </Field>
                  <Field label={t(lang, 'socialIconVariantLabel')}>
                    <SocialIconVariantPicker
                      platform={network.platform}
                      lang={lang}
                      selectedVariant={normalizeSocialIconVariant(
                        network.platform,
                        String(form[network.iconVariantKey])
                      )}
                      customIconUrl={String(form[network.iconUrlKey])}
                      onSelectVariant={(variant) =>
                        updateForm({
                          [network.iconVariantKey]: variant,
                          [network.iconUrlKey]: ''
                        })
                      }
                    />
                  </Field>
                  <Field label={t(lang, 'iconUrl')}>
                    <TextInput
                      value={String(form[network.iconUrlKey])}
                      placeholder={t(lang, 'optionalPlaceholder')}
                      onChange={(e) => updateForm({ [network.iconUrlKey]: e.target.value })}
                    />
                  </Field>
                  <Field label={t(lang, 'iconFile')}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        app.handleFileToField(e.target.files?.[0], network.iconUrlKey)
                      }
                    />
                  </Field>
                </div>
              </details>
            ))}
          </Panel>

          <Panel summary={t(lang, 'layoutTypography')}>
            <div className="grid">
              <div className="brand-preset-row">
                <Field label={t(lang, 'brandPreset')}>
                  <SelectInput value={brandPresetId} onChange={(e) => applyBrandPreset(e.target.value)}>
                    <option value="">{t(lang, 'brandPresetPlaceholder')}</option>
                    {SBA_BRAND_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label[lang]}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <div className="brand-swatches" aria-label={t(lang, 'brandColors')}>
                  {SBA_BRAND_COLORS.map((color) => (
                    <span
                      key={color}
                      className="brand-swatch"
                      title={color}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="hint">{t(lang, 'brandPresetHint')}</p>
              </div>
              <Field label={t(lang, 'fontFamily')}>
                <SelectInput
                  value={form.fontFamily}
                  onChange={(e) => updateForm({ fontFamily: e.target.value })}
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              {showOutlookFontNotice && bundledFontName && (
                <div className="outlook-font-notice">
                  <p className="hint">{t(lang, 'outlookFontHint')}</p>
                  <div className="outlook-font-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={app.handleInstallWindowsFont}
                    >
                      {t(lang, 'installWindowsFont').replace('{font}', bundledFontName)}
                    </button>
                    {bundledFontDownloadUrl && (
                      <a
                        className="btn-link"
                        href={bundledFontDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t(lang, 'downloadFontFromGoogle')}
                      </a>
                    )}
                  </div>
                </div>
              )}
              {(
                [
                  ['nameFontWeight', 'nameFontWeight'],
                  ['titleFontWeight', 'titleFontWeight'],
                  ['bodyFontWeight', 'bodyFontWeight']
                ] as const
              ).map(([key, labelKey]) => (
                <Field key={key} label={t(lang, labelKey)}>
                  <SelectInput
                    value={String(form[key])}
                    onChange={(e) => updateForm({ [key]: Number(e.target.value) })}
                  >
                    {FONT_WEIGHT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              ))}
              <Field label={t(lang, 'nameFontSize')}>
                <input
                  type="number"
                  min={14}
                  max={72}
                  value={form.nameFontSize}
                  onChange={(e) => updateForm({ nameFontSize: Number(e.target.value) })}
                />
              </Field>
              <Field label={t(lang, 'titleFontSize')}>
                <input
                  type="number"
                  min={10}
                  max={48}
                  value={form.titleFontSize}
                  onChange={(e) => updateForm({ titleFontSize: Number(e.target.value) })}
                />
              </Field>
              <Field label={t(lang, 'bodyFontSize')}>
                <input
                  type="number"
                  min={9}
                  max={24}
                  value={form.bodyFontSize}
                  onChange={(e) => updateForm({ bodyFontSize: Number(e.target.value) })}
                />
              </Field>
              <Field label={t(lang, 'lineSpacing')}>
                <input
                  type="number"
                  min={1}
                  max={2}
                  step={0.05}
                  value={form.lineSpacing}
                  onChange={(e) => updateForm({ lineSpacing: Number(e.target.value) })}
                />
              </Field>
              <Field label={t(lang, 'signatureWidth')}>
                <input
                  type="number"
                  min={250}
                  max={900}
                  value={form.signatureWidth}
                  onChange={(e) => updateForm({ signatureWidth: Number(e.target.value) })}
                />
              </Field>
              <Field label={t(lang, 'signatureHeight')}>
                <input
                  type="number"
                  min={120}
                  max={500}
                  value={form.signatureHeight}
                  onChange={(e) => updateForm({ signatureHeight: Number(e.target.value) })}
                />
              </Field>
              <Field label={t(lang, 'textColumnWidth')}>
                <input
                  type="number"
                  min={120}
                  max={760}
                  value={form.textColumnWidth}
                  onChange={(e) => updateForm({ textColumnWidth: Number(e.target.value) })}
                />
              </Field>
            </div>
          </Panel>

          <Panel summary={t(lang, 'positionAlignment')}>
            <div className="grid">
              {(
                [
                  ['textAlign', 'mainTextAlign'],
                  ['nameTitleAlign', 'nameTitleAlign'],
                  ['emailAlign', 'emailAlign']
                ] as const
              ).map(([key, labelKey]) => (
                <Field key={key} label={t(lang, labelKey)}>
                  <SelectInput
                    value={form[key]}
                    onChange={(e) =>
                      updateForm({ [key]: e.target.value as SignatureFormState[typeof key] })
                    }
                  >
                    {alignOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              ))}
              {(
                [
                  ['textOffsetX', 'textOffsetX'],
                  ['textOffsetY', 'textOffsetY'],
                  ['dividerThickness', 'dividerThickness'],
                  ['socialIconGap', 'socialIconGap']
                ] as const
              ).map(([key, labelKey]) => (
                <Field key={key} label={t(lang, labelKey)}>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => updateForm({ [key]: Number(e.target.value) })}
                  />
                </Field>
              ))}
            </div>
          </Panel>

          <Panel summary={t(lang, 'colors')}>
            <p className="hint">{t(lang, 'elementColorsHint')}</p>
            <div className="grid">
              {(
                [
                  ['backgroundColor', 'background'],
                  ['dividerColor', 'divider'],
                  ['textColor', 'primaryText'],
                  ['nameColor', 'fullName'],
                  ['jobTitleColor', 'jobTitle'],
                  ['companyColor', 'company'],
                  ['contactLabelColor', 'contactLabels'],
                  ['phoneColor', 'phone'],
                  ['emailColor', 'email'],
                  ['websiteColor', 'website']
                ] as const
              ).map(([key, labelKey]) => (
                <Field key={key} label={t(lang, labelKey)}>
                  <ColorInput
                    value={form[key]}
                    onChange={(next) => updateForm({ [key]: next })}
                  />
                </Field>
              ))}
            </div>
          </Panel>

          <Panel summary={t(lang, 'extraLinkedImages')}>
            <p className="hint">{t(lang, 'extraLinkedImagesHint')}</p>
            {form.linkImages.map((row) => (
              <div key={row.id} className="link-image-row">
                <Field label={t(lang, 'imageUrl')}>
                  <TextInput
                    value={row.imageUrl}
                    placeholder={t(lang, 'urlPlaceholder')}
                    onChange={(e) => app.updateLinkImage(row.id, { imageUrl: e.target.value })}
                  />
                </Field>
                <Field label={t(lang, 'linkUrl')}>
                  <TextInput
                    value={row.href}
                    placeholder={t(lang, 'urlPlaceholder')}
                    onChange={(e) => app.updateLinkImage(row.id, { href: e.target.value })}
                  />
                </Field>
                <Field label={t(lang, 'altText')}>
                  <TextInput
                    value={row.alt}
                    placeholder={t(lang, 'linkedImageAlt')}
                    onChange={(e) => app.updateLinkImage(row.id, { alt: e.target.value })}
                  />
                </Field>
                <Field label={t(lang, 'imageFile')}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const dataUrl = await fileToDataUrl(file)
                        if (dataUrl) app.updateLinkImage(row.id, { imageUrl: dataUrl })
                      } catch {
                        // ignore
                      }
                    }}
                  />
                </Field>
                <button
                  type="button"
                  className="secondary remove-link-image"
                  onClick={() => app.removeLinkImage(row.id)}
                >
                  {t(lang, 'remove')}
                </button>
              </div>
            ))}
            <button type="button" className="secondary add-link-image-btn" onClick={() => app.addLinkImage()}>
              {t(lang, 'addLinkedImage')}
            </button>
          </Panel>
        </div>

        <div className="actions-bar">
          <div className="actions">
            <button type="button" className="primary" onClick={() => app.generate()}>
              {t(lang, 'generateSignature')}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                app.copyOutput().catch(() => {
                  navigator.clipboard.writeText(app.outputHtml)
                })
              }}
            >
              {t(lang, 'copyHtml')}
            </button>
            <button type="button" className="secondary" onClick={app.handleDownload}>
              {t(lang, 'downloadHtml')}
            </button>
            <button type="button" className="secondary" onClick={app.handleInstallOutlook}>
              {t(lang, 'installOutlook')}
            </button>
            <button type="button" className="secondary" onClick={app.handleInstallNewOutlook}>
              {t(lang, 'newOutlookSetup')}
            </button>
          </div>
          <p
            className="hint"
            style={{ marginTop: 10 }}
            dir={lang === 'he' ? 'rtl' : 'ltr'}
            onClick={onOutlookHelpClick}
            dangerouslySetInnerHTML={{ __html: outlookHelpStatusHtml(lang) }}
          />
          <Panel className="install-guide" style={{ marginTop: 14 }} summary={t(lang, 'installGuide')}>
            <p className="hint">{t(lang, 'installGuideLead')}</p>
            <div className="install-guide-media">
              <img
                src="/images/install-outlook.gif"
                width={960}
                height={720}
                alt={t(lang, 'installGuideAlt')}
                loading="lazy"
              />
            </div>
          </Panel>
        </div>
      </section>

      <aside
        ref={app.previewCardRef}
        className={`card card-preview sidebar-preview${app.previewHighlight ? ' preview-highlight' : ''}`}
        aria-label={t(lang, 'preview')}
      >
        <div className="sidebar-preview-header">
          <h2>{t(lang, 'preview')}</h2>
          <p className="hint">{t(lang, 'livePreviewHint')}</p>
        </div>
        <div className="sidebar-preview-body">
          <OutlookPreviewPane
            html={app.outputHtml}
            width={app.layout.signatureWidth}
            minHeight={app.layout.signatureHeight}
            emailAlign={app.layout.emailAlign}
            lang={lang}
          />
          <StyleSummary layout={app.layout} lang={lang} />
        </div>
      </aside>
      </div>

      <section className="card card-output">
        <details className="panel" style={{ border: 0, background: 'transparent' }}>
          <summary>{t(lang, 'generatedHtml')}</summary>
          <div className="panel-body" style={{ borderTop: 0 }}>
            <textarea value={app.outputHtml} readOnly spellCheck={false} />
          </div>
        </details>
      </section>
      <Toaster toasts={app.toasts} onDismiss={app.dismissToast} />
      <UpdatePrompt lang={lang} />
    </main>
  )
}
