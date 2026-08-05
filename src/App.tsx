import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { SBA_BRAND_COLORS, SBA_BRAND_PRESETS } from './brandPresets'
import { BulkSignaturesPanel } from './components/BulkSignaturesPanel'
import { Field, SelectInput, TextAreaInput, TextInput } from './components/Field'
import { ColorInput } from './components/ColorInput'
import { Panel } from './components/Panel'
import { SubPanel } from './components/SubPanel'
import { EditorNavBar } from './components/EditorNavBar'
import { LanguageToggle } from './components/LanguageToggle'
import { ThemeToggle } from './components/ThemeToggle'
import { UiFontControls } from './components/UiFontControls'
import { UserMenu } from './components/UserMenu'
import { Toaster } from './components/Toaster'
import { StyleSummary } from './components/StyleSummary'
import { PlacementControl } from './components/PlacementControl'
import { useResizableSidebar } from './hooks/useResizableSidebar'
import { useUiTheme } from './hooks/useUiTheme'
import { useUiFont } from './hooks/useUiFont'
import { useUiLanguage } from './contexts/UiLanguageContext'
import { UpdatePrompt } from './components/UpdatePrompt'
import { useSignatureApp } from './hooks/useSignatureApp'
import { outlookHelpStatusHtml, t, type AppLanguage } from './i18n'
import {
  getBundledFontCssFamily,
  googleFontDownloadUrl,
  isBundledWebFont
} from './lib/signatureFonts'
import { formatBuildStamp, getAppVersion } from './lib/buildInfo'
import { ChangelogModal } from './components/ChangelogModal'
import { CreatorModal, CREATOR_NAME } from './components/CreatorModal'
import { InstallOutlookWizard } from './components/InstallOutlookWizard'
import { normalizeSocialIconVariant, type SocialPlatform } from './lib/socialIconCatalog'
import {
  applySignatureLayoutPreset,
  detectSignatureLayoutPreset,
  SIGNATURE_LAYOUT_PRESETS
} from './lib/signatureLayoutPresets'
import { SocialIconVariantPicker } from './components/SocialIconVariantPicker'
import { fileToDataUrl } from './lib/signatureUtils'
import type { LinkImagePlacement, SignatureFormState, TextAlign } from './types/signatureForm'

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
}) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const signatureRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(minHeight)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const updateScale = () => {
      const available = wrap.clientWidth
      if (!available || width <= 0) {
        setPreviewScale(1)
        return
      }
      setPreviewScale(available < width ? Math.max(0.35, available / width) : 1)
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [width])

  useEffect(() => {
    const signature = signatureRef.current
    if (!signature) return

    const measureHeight = () => {
      setContentHeight(Math.max(signature.offsetHeight, signature.scrollHeight, minHeight))
    }

    measureHeight()
    const observer = new ResizeObserver(measureHeight)
    observer.observe(signature)
    return () => observer.disconnect()
  }, [html, minHeight])

  const isScaled = previewScale < 1
  const scaledWidth = Math.max(1, Math.round(width * previewScale))
  const scaledHeight = Math.max(48, Math.round(contentHeight * previewScale))
  const hebrewPreview = lang === 'he'

  return (
    <div className="outlook-preview" aria-label={t(lang, 'preview')}>
      <div className="outlook-preview-window">
        <div className="outlook-preview-chrome">
          <span className="outlook-preview-dot outlook-preview-dot--close" aria-hidden="true" />
          <span className="outlook-preview-dot outlook-preview-dot--minimize" aria-hidden="true" />
          <span className="outlook-preview-dot outlook-preview-dot--maximize" aria-hidden="true" />
          <span className="outlook-preview-chrome-title">{t(lang, 'outlookPreviewTitle')}</span>
        </div>
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
            <div ref={wrapRef} className="outlook-preview-signature-wrap">
              <div
                className="outlook-preview-signature-scale"
                style={
                  isScaled
                    ? {
                        position: 'relative',
                        width: `${scaledWidth}px`,
                        maxWidth: '100%',
                        height: `${scaledHeight}px`
                      }
                    : undefined
                }
              >
                <div
                  ref={signatureRef}
                  className="preview outlook-preview-signature"
                  style={{
                    width: `${width}px`,
                    minHeight: `${minHeight}px`,
                    height: 'auto',
                    ...(isScaled
                      ? {
                          position: 'absolute',
                          top: 0,
                          right: hebrewPreview ? 0 : undefined,
                          left: hebrewPreview ? undefined : 0,
                          transform: `scale(${previewScale})`,
                          transformOrigin: hebrewPreview ? 'top right' : 'top left'
                        }
                      : {})
                  }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const app = useSignatureApp()
  const { uiTheme, setUiTheme } = useUiTheme()
  const uiFont = useUiFont()
  const { setUiLanguage } = useUiLanguage()
  const { form, updateForm, lang,
    tenantPresetsAvailable,
    tenantPresets,
    tenantDefaultPresetId,
    handleSaveTenantPreset,
    handleDeleteTenantPreset,
    handleSetTenantDefaultPreset,
    applyTenantPreset,
  } = app

  useEffect(() => {
    setUiLanguage(lang)
  }, [lang, setUiLanguage])
  const {
    sidebarWidth,
    sidebarScrollRef,
    fitToContentWidth,
    measureAndFitScrollContent,
    onResizePointerDown,
    onResizePointerMove,
    onResizePointerUp
  } = useResizableSidebar(lang === 'he')
  const [aiPresetId, setAiPresetId] = useState('')
  const [brandPresetId, setBrandPresetId] = useState('')
  const [tenantPresetSaveOpen, setTenantPresetSaveOpen] = useState(false)
  const [tenantPresetSaveName, setTenantPresetSaveName] = useState('')
  const [tenantPresetSaving, setTenantPresetSaving] = useState(false)
  const [signatureImageFile, setSignatureImageFile] = useState<File | undefined>()
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [creatorOpen, setCreatorOpen] = useState(false)

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
    { value: 'right', label: t(lang, 'logoSideRight') },
    { value: 'top', label: t(lang, 'logoSideTop') },
    { value: 'bottom', label: t(lang, 'logoSideBottom') },
    { value: 'none', label: t(lang, 'logoSideNone') }
  ] as const

  const linkImagePlacementOptions = [
    { value: 'footer', label: t(lang, 'linkedImagePlacementFooter') },
    { value: 'with-social', label: t(lang, 'linkedImagePlacementWithSocial') },
    { value: 'top', label: t(lang, 'linkedImagePlacementTop') },
    { value: 'bottom', label: t(lang, 'linkedImagePlacementBottom') }
  ] as const

  const activeLayoutPreset = detectSignatureLayoutPreset(form)

  const applyLayoutPreset = (presetId: (typeof SIGNATURE_LAYOUT_PRESETS)[number]['id']) => {
    updateForm(applySignatureLayoutPreset(presetId, form))
  }

  useEffect(() => {
    fitToContentWidth(app.layout.signatureWidth)
  }, [app.layout.signatureWidth, fitToContentWidth])

  useEffect(() => {
    measureAndFitScrollContent()
  }, [app.outputHtml, measureAndFitScrollContent])

  const workspaceStyle = { '--sidebar-width': `${sidebarWidth}px` } as CSSProperties

  const bundledFontName = getBundledFontCssFamily(form.fontFamily)
  const bundledFontDownloadUrl = googleFontDownloadUrl(form.fontFamily)
  const showOutlookFontNotice = isBundledWebFont(form.fontFamily)

  const onOutlookHelpClick = useCallback(
    (event: React.MouseEvent<HTMLParagraphElement>) => {
      const openFolder = (event.target as HTMLElement).closest('.open-signatures-folder')
      if (openFolder) {
        event.preventDefault()
        app.handleOpenSignaturesFolder()
        return
      }
      const exportZip = (event.target as HTMLElement).closest('.export-signatures-zip')
      if (exportZip) {
        event.preventDefault()
        app.handleExportSignaturesZip()
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

  const submitSaveTenantPreset = async () => {
    const name = tenantPresetSaveName.trim()
    if (!name) return
    setTenantPresetSaving(true)
    const ok = await handleSaveTenantPreset(name)
    setTenantPresetSaving(false)
    if (ok) {
      setTenantPresetSaveOpen(false)
      setTenantPresetSaveName('')
    }
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

  const fontControls = (
    <UiFontControls
      lang={lang}
      fontId={uiFont.fontId}
      fontScale={uiFont.fontScale}
      onFontChange={uiFont.setFontId}
      onIncrease={uiFont.increaseFontScale}
      onDecrease={uiFont.decreaseFontScale}
      canIncrease={uiFont.canIncrease}
      canDecrease={uiFont.canDecrease}
    />
  )

  return (
    <main className="app-shell">
      <header className="app-mobile-chrome" aria-label={t(lang, 'uiThemeToggleLabel')}>
        {fontControls}
        <ThemeToggle lang={lang} theme={uiTheme} onChange={setUiTheme} />
        <LanguageToggle lang={lang} onChange={app.handleLanguageChange} />
        <UserMenu lang={lang} />
      </header>

      <div className="ui-precision-only">
        <header className="app-topbar">
          <div className="app-topbar-brand">
            <span className="app-topbar-title">{t(lang, 'pageHeading')}</span>
          </div>
          <div className="app-topbar-actions">
            {fontControls}
            <ThemeToggle lang={lang} theme={uiTheme} onChange={setUiTheme} />
            <LanguageToggle lang={lang} onChange={app.handleLanguageChange} />
            <UserMenu lang={lang} />
            <button type="button" className="btn-topbar-primary" onClick={() => app.generate()}>
              {t(lang, 'generateSignature')}
            </button>
          </div>
        </header>
      </div>

      <div className="page">
        <div className="ui-classic-only card-header-title">
          <div className="classic-topbar-actions">
            {fontControls}
            <ThemeToggle lang={lang} theme={uiTheme} onChange={setUiTheme} />
            <LanguageToggle lang={lang} onChange={app.handleLanguageChange} />
            <UserMenu lang={lang} />
          </div>
          <h1>{t(lang, 'pageHeading')}</h1>
          <p className="lead">{t(lang, 'pageLead')}</p>
        </div>

        <EditorNavBar
          lang={lang}
          scrollContainerRef={sidebarScrollRef}
          usePageScroll={uiTheme === 'classic'}
        />

      <div className="workspace" style={workspaceStyle}>
      <aside className="editor-sidebar">
        <div className="editor-sidebar-header">
          <h2>{t(lang, 'editorSidebarTitle')}</h2>
          <p className="editor-sidebar-subtitle">
            v{getAppVersion()} · {t(lang, 'editorActiveTemplate')}
          </p>
        </div>
        <div className="editor-sidebar-scroll" ref={sidebarScrollRef}>
      <section className="card card-editor">
        <div className="card-header">
          <div className="form-storage-bar">
            <div className="workspace-toolbar-row workspace-toolbar-row--primary">
              <div className="history-controls" role="group" aria-label={t(lang, 'undo')}>
                <button
                  type="button"
                  className="btn-undo"
                  disabled={!app.canUndo}
                  title={t(lang, 'undoShortcut')}
                  aria-label={t(lang, 'undo')}
                  onClick={app.undo}
                >
                  <span className="material-symbols-outlined panel-icon--no-flip" aria-hidden="true">
                    undo
                  </span>
                </button>
                <button
                  type="button"
                  className="btn-redo"
                  disabled={!app.canRedo}
                  title={t(lang, 'redoShortcut')}
                  aria-label={t(lang, 'redo')}
                  onClick={app.redo}
                >
                  <span className="material-symbols-outlined panel-icon--no-flip" aria-hidden="true">
                    redo
                  </span>
                </button>
              </div>
              <input
                type="text"
                className="saved-signatures-name"
                value={app.saveAsName}
                placeholder={app.saveAsNamePlaceholder}
                aria-label={t(lang, 'saveAsPrompt')}
                onChange={(event) => app.setSaveAsName(event.target.value)}
              />
              <button type="button" className="btn-save-as" onClick={app.handleSaveAs}>
                {t(lang, 'saveAs')}
              </button>
            </div>
            <div className="workspace-toolbar-row workspace-toolbar-row--load">
              {app.cloudStorageAvailable && (
                <span className="cloud-storage-hint">{t(lang, 'cloudStorageHint')}</span>
              )}
              <select
                className="saved-signatures-select"
                value={app.activeSavedId}
                aria-label={t(lang, 'savedLoadPlaceholder')}
                onChange={(event) => {
                  app.handleLoadSaved(event.target.value).catch(() => undefined)
                }}
              >
                <option value="">{t(lang, 'savedLoadPlaceholder')}</option>
                {app.savedSignatures.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-delete-saved"
                disabled={!app.activeSavedId}
                onClick={app.handleDeleteSaved}
              >
                {t(lang, 'savedDelete')}
              </button>
            </div>
            <details className="workspace-toolbar-more">
              <summary>{t(lang, 'toolbarMore')}</summary>
              <div className="workspace-toolbar-more-body">
                <button type="button" className="btn-toolbar-muted" onClick={app.handleExportParams}>
                  {t(lang, 'exportParams')}
                </button>
                <button type="button" className="btn-toolbar-muted" onClick={app.handleExportStyle}>
                  {t(lang, 'exportStyle')}
                </button>
                <label className="params-import-label">
                  <span className="btn-toolbar-muted params-import-button">{t(lang, 'importParams')}</span>
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
                <button type="button" className="btn-toolbar-danger" onClick={app.resetFormToDefaults}>
                  {t(lang, 'resetForm')}
                </button>
              </div>
            </details>
          </div>
        </div>

        <div className="panels">
          <Panel
            id="panel-ai"
            className="ai-panel"
            icon="auto_awesome"
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

          <Panel id="panel-image-import" icon="image" summary={t(lang, 'imageImport')}>
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

          <Panel id="panel-contact" defaultOpen icon="person" summary={t(lang, 'contactDetails')}>
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
              <Field label={t(lang, 'outlookSignatureName')}>
                <TextInput
                  value={form.outlookSignatureName}
                  placeholder={t(lang, 'outlookSignatureNamePlaceholder')}
                  onChange={(e) => updateForm({ outlookSignatureName: e.target.value })}
                />
                <p className="hint" style={{ marginTop: 6 }}>
                  {t(lang, 'outlookSignatureNameHint')}
                </p>
              </Field>
              <Field label={t(lang, 'jobTitle')}>
                <TextAreaInput
                  className="field-textarea"
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

          <BulkSignaturesPanel
            template={form}
            designerForm={form}
            lang={lang}
            onLoadDesignerForm={(loaded, options) => app.setForm(loaded, options)}
            onPreviewContentWidth={fitToContentWidth}
          />

          <Panel id="panel-logo" icon="image" summary={t(lang, 'logoBanner')}>
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
            <SubPanel summary={t(lang, 'signatureLayout')} defaultOpen>
              <p className="hint">{t(lang, 'signatureLayoutHint')}</p>
              <div className="layout-preset-grid" role="radiogroup" aria-label={t(lang, 'signatureLayout')}>
                {SIGNATURE_LAYOUT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={activeLayoutPreset === preset.id}
                    className={`layout-preset${activeLayoutPreset === preset.id ? ' is-active' : ''}`}
                    onClick={() => applyLayoutPreset(preset.id)}
                  >
                    <span className="layout-preset-icon" aria-hidden="true">
                      {preset.icon}
                    </span>
                    <span className="layout-preset-label">{t(lang, preset.labelKey)}</span>
                  </button>
                ))}
              </div>
            </SubPanel>
            <div className="logo-placement-block">
              <h3 className="logo-placement-heading">{t(lang, 'logoPlacement')}</h3>
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
              <Field label={t(lang, 'bannerMaxWidth')}>
                <input
                  type="number"
                  min={120}
                  max={900}
                  value={form.bannerMaxWidth}
                  onChange={(e) => updateForm({ bannerMaxWidth: Number(e.target.value) })}
                />
              </Field>
            </div>
          </Panel>

          <Panel id="panel-social" icon="share" summary={t(lang, 'socialMedia')}>
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

          <Panel id="panel-layout" icon="palette" summary={t(lang, 'layoutTypography')}>
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

              {tenantPresetsAvailable && (
                <div className="tenant-preset-row">
                  <Field label={t(lang, 'tenantPresets')}>
                    <SelectInput value="" onChange={(e) => {
                      const entry = tenantPresets.find((p) => p.id === e.target.value)
                      if (entry) applyTenantPreset(entry)
                    }}>
                      <option value="">{t(lang, 'tenantPresetPlaceholder')}</option>
                      {tenantPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}{preset.id === tenantDefaultPresetId ? ' ★' : ''}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  {tenantPresets.length > 0 && (
                    <div className="tenant-preset-actions">
                      {tenantPresets.map((preset) => (
                        <div key={preset.id} className="tenant-preset-action-row">
                          <span className="tenant-preset-action-name">{preset.name}</span>
                          <button
                            type="button"
                            className="tenant-preset-btn"
                            title={preset.id === tenantDefaultPresetId
                              ? t(lang, 'tenantPresetClearDefault')
                              : t(lang, 'tenantPresetSetDefault')}
                            aria-label={preset.id === tenantDefaultPresetId
                              ? t(lang, 'tenantPresetClearDefault')
                              : t(lang, 'tenantPresetSetDefault')}
                            onClick={() => { void handleSetTenantDefaultPreset(
                              preset.id === tenantDefaultPresetId ? null : preset.id
                            ) }}
                          >
                            {preset.id === tenantDefaultPresetId ? '★' : '☆'}
                          </button>
                          <button
                            type="button"
                            className="tenant-preset-btn tenant-preset-btn--delete"
                            title={t(lang, 'tenantPresetDelete')}
                            aria-label={t(lang, 'tenantPresetDelete')}
                            onClick={() => { void handleDeleteTenantPreset(preset.id) }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!tenantPresetSaveOpen && (
                    <button
                      type="button"
                      className="tenant-preset-save-btn"
                      onClick={() => setTenantPresetSaveOpen(true)}
                    >
                      {t(lang, 'tenantPresetSaveButton')}
                    </button>
                  )}

                  {tenantPresetSaveOpen && (
                    <div className="tenant-preset-save-form">
                      <label htmlFor="tenant-preset-name-input" className="field-label">{t(lang, 'tenantPresetNameLabel')}</label>
                      <input
                        id="tenant-preset-name-input"
                        type="text"
                        className="text-input"
                        placeholder={t(lang, 'tenantPresetNamePlaceholder')}
                        value={tenantPresetSaveName}
                        onChange={(e) => setTenantPresetSaveName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void submitSaveTenantPreset() }}
                        autoFocus
                      />
                      <div className="tenant-preset-save-btns">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={!tenantPresetSaveName.trim() || tenantPresetSaving}
                          onClick={submitSaveTenantPreset}
                        >
                          {t(lang, 'tenantPresetSaveConfirm')}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => { setTenantPresetSaveOpen(false); setTenantPresetSaveName('') }}
                        >
                          {t(lang, 'tenantPresetCancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
              <Field label={t(lang, 'rasterizeNameTitle')}>
                <label className="ai-keep-contact">
                  <input
                    type="checkbox"
                    checked={form.rasterizeNameTitle}
                    onChange={(e) => updateForm({ rasterizeNameTitle: e.target.checked })}
                  />
                  <span className="hint">{t(lang, 'rasterizeNameTitleHint')}</span>
                </label>
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

          <Panel id="panel-position" icon="straighten" summary={t(lang, 'positionAlignment')}>
            <div className="grid">
              <Field label={t(lang, 'contactMatchNameTitle')}>
                <label className="ai-keep-contact">
                  <input
                    type="checkbox"
                    checked={form.contactMatchNameTitle !== false}
                    onChange={(e) => updateForm({ contactMatchNameTitle: e.target.checked })}
                  />
                  <span className="hint">{t(lang, 'contactMatchNameTitleHint')}</span>
                </label>
              </Field>
              <Field label={t(lang, 'showContactLabels')}>
                <label className="ai-keep-contact">
                  <input
                    type="checkbox"
                    checked={form.showContactLabels !== false}
                    onChange={(e) => updateForm({ showContactLabels: e.target.checked })}
                  />
                  <span className="hint">{t(lang, 'showContactLabelsHint')}</span>
                </label>
              </Field>
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
                    disabled={key === 'textAlign' && form.contactMatchNameTitle !== false}
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
                  {key === 'textAlign' ? <p className="hint">{t(lang, 'mainTextAlignHint')}</p> : null}
                </Field>
              ))}
              {(
                [
                  ['textOffsetX', 'textOffsetX'],
                  ['textOffsetY', 'textOffsetY'],
                  ['dividerThickness', 'dividerThickness'],
                  ['dividerSpacing', 'dividerSpacing'],
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

          <Panel id="panel-colors" icon="format_color_fill" summary={t(lang, 'colors')}>
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

          <Panel id="panel-linked-images" icon="link" summary={t(lang, 'extraLinkedImages')}>
            <p className="hint">{t(lang, 'extraLinkedImagesHint')}</p>
            {form.linkImages.map((row) => (
              <div key={row.id} className="link-image-row">
                {row.imageUrl ? (
                  <div className="link-image-preview" aria-label={t(lang, 'linkedImageAlt')}>
                    <img src={row.imageUrl} alt={row.alt || t(lang, 'linkedImageAlt')} />
                  </div>
                ) : null}
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
                <Field label={t(lang, 'linkedImagePlacement')}>
                  <SelectInput
                    value={row.placement}
                    onChange={(e) =>
                      app.updateLinkImage(row.id, {
                        placement: e.target.value as LinkImagePlacement
                      })
                    }
                  >
                    {linkImagePlacementOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label={t(lang, 'linkedImageAlign')}>
                  <SelectInput
                    value={row.align}
                    onChange={(e) =>
                      app.updateLinkImage(row.id, { align: e.target.value as TextAlign })
                    }
                  >
                    {alignOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label={t(lang, 'linkedImageMaxWidth')}>
                  <input
                    type="number"
                    min={24}
                    max={760}
                    value={row.maxWidth}
                    onChange={(e) =>
                      app.updateLinkImage(row.id, { maxWidth: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label={t(lang, 'linkedImageMaxHeight')}>
                  <input
                    type="number"
                    min={16}
                    max={320}
                    value={row.maxHeight}
                    onChange={(e) =>
                      app.updateLinkImage(row.id, { maxHeight: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label={t(lang, 'linkedImageOffsetX')}>
                  <PlacementControl
                    value={row.offsetX}
                    min={-80}
                    max={80}
                    onChange={(offsetX) => app.updateLinkImage(row.id, { offsetX })}
                  />
                </Field>
                <Field label={t(lang, 'linkedImageOffsetY')}>
                  <PlacementControl
                    value={row.offsetY}
                    min={-40}
                    max={40}
                    onChange={(offsetY) => app.updateLinkImage(row.id, { offsetY })}
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

          <Panel id="panel-install" className="install-guide" icon="download" summary={t(lang, 'installGuide')}>
            <p className="hint">{t(lang, 'installGuideLead')}</p>
            <div className="install-guide-actions">
              <button type="button" className="primary" onClick={app.handleInstallOutlook}>
                {t(lang, 'installOutlook')}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  app.handleInstallNewOutlook().catch(() => undefined)
                }}
              >
                {t(lang, 'newOutlookSetup')}
              </button>
            </div>
            <div className="install-guide-media">
              <img
                src="/images/install-outlook.gif"
                width={960}
                height={720}
                alt={t(lang, 'installGuideAlt')}
                loading="lazy"
              />
            </div>
            <p
              className="hint"
              style={{ marginTop: 10 }}
              dir={lang === 'he' ? 'rtl' : 'ltr'}
              onClick={onOutlookHelpClick}
              dangerouslySetInnerHTML={{ __html: outlookHelpStatusHtml(lang) }}
            />
          </Panel>

          <Panel icon="code" className="html-output-panel" summary={t(lang, 'generatedHtml')}>
            <textarea
              className="html-output-textarea"
              value={app.outputHtml}
              readOnly
              spellCheck={false}
            />
          </Panel>
        </div>
      </section>
        </div>
      </aside>

      <div
        className="sidebar-resize-handle ui-precision-only"
        role="separator"
        aria-orientation="vertical"
        aria-label={t(lang, 'sidebarResize')}
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
      />

      <section className="preview-main">
        <div className="preview-sticky-shell">
          <div className="preview-main-header">
            <div>
              <h1>{t(lang, 'previewPageHeading')}</h1>
              <p className="lead">{t(lang, 'livePreviewHint')}</p>
            </div>
            <div className="preview-main-actions">
              <button
                type="button"
                className="btn-preview-outline"
                onClick={() => {
                  app.copyOutput().catch(() => {
                    navigator.clipboard.writeText(app.outputHtml)
                  })
                }}
              >
                {t(lang, 'copyHtml')}
              </button>
              <button
                type="button"
                className="btn-preview-outline"
                onClick={() => {
                  app.handleDownloadPng().catch(() => undefined)
                }}
              >
                {t(lang, 'downloadPng')}
              </button>
              <button type="button" className="btn-preview-outline" onClick={app.handleInstallOutlook}>
                {t(lang, 'installOutlook')}
              </button>
              <button
                type="button"
                className="btn-preview-solid"
                onClick={() => {
                  app.handleInstallNewOutlook().catch(() => undefined)
                }}
              >
                {t(lang, 'newOutlookSetup')}
              </button>
            </div>
          </div>
          <aside
            ref={app.previewCardRef}
            className={`card card-preview sidebar-preview preview-sticky-signature${app.previewHighlight ? ' preview-highlight' : ''}`}
            aria-label={t(lang, 'preview')}
          >
            <OutlookPreviewPane
              html={app.outputHtml}
              width={app.layout.signatureWidth}
              minHeight={app.layout.signatureHeight}
              emailAlign={app.layout.emailAlign}
              lang={lang}
            />
          </aside>
        </div>
        <div className="preview-main-scroll">
          <StyleSummary layout={app.layout} lang={lang} />
          <div className="preview-insights">
            <article className="preview-insight-card preview-insight-card--primary">
              <span className="material-symbols-outlined panel-icon--no-flip" aria-hidden="true">
                bolt
              </span>
              <h4>{t(lang, 'insightOneClickTitle')}</h4>
              <p>{t(lang, 'insightOneClickBody')}</p>
            </article>
            <article className="preview-insight-card preview-insight-card--wide">
              <div className="preview-insight-icon-wrap">
                <span className="material-symbols-outlined panel-icon--no-flip" aria-hidden="true">
                  analytics
                </span>
              </div>
              <div>
                <h4>{t(lang, 'insightAnalyticsTitle')}</h4>
                <p>{t(lang, 'insightAnalyticsBody')}</p>
              </div>
            </article>
          </div>
        </div>
      </section>
      </div>

      <div className="ui-classic-only classic-actions-bar">
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
          <button
            type="button"
            className="secondary"
            onClick={() => {
              app.handleDownloadPng().catch(() => undefined)
            }}
          >
            {t(lang, 'downloadPng')}
          </button>
          <button type="button" className="secondary" onClick={app.handleInstallOutlook}>
            {t(lang, 'installOutlook')}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              app.handleInstallNewOutlook().catch(() => undefined)
            }}
          >
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
      </div>

      <section className="ui-classic-only card card-output">
        <details className="panel" style={{ border: 0, background: 'transparent' }}>
          <summary>{t(lang, 'generatedHtml')}</summary>
          <div className="panel-body" style={{ borderTop: 0 }}>
            <textarea value={app.outputHtml} readOnly spellCheck={false} />
          </div>
        </details>
      </section>
      </div>

      <footer className="app-enterprise-footer ui-precision-only">
        <div className="app-enterprise-footer-brand">
          <span className="app-enterprise-footer-product">
            {t(lang, 'footerProduct')} v{getAppVersion()}
          </span>
          <span className="app-enterprise-footer-sep" aria-hidden="true">
            |
          </span>
          <span className="app-enterprise-footer-meta">
            {t(lang, 'footerCreatedBy').replace('{name}', CREATOR_NAME)}
          </span>
        </div>
        <div className="app-enterprise-footer-actions">
          {/* Real anchor, not a router push: the guides are statically generated
              pages and this is the internal link that lets crawlers reach them. */}
          <a
            className="app-enterprise-footer-link"
            href={lang === 'he' ? '/he/guides' : '/guides'}
          >
            {t(lang, 'footerGuides')}
          </a>
          <button
            type="button"
            className="app-enterprise-footer-link"
            onClick={() => setCreatorOpen(true)}
          >
            {CREATOR_NAME}
          </button>
          <button
            type="button"
            className="app-enterprise-footer-link"
            onClick={() => setChangelogOpen(true)}
          >
            {t(lang, 'footerChangelog')}
          </button>
          <button
            type="button"
            className="app-enterprise-footer-link build-stamp build-stamp--footer"
            title={t(lang, 'changelogTitle')}
            aria-label={t(lang, 'changelogTitle')}
            onClick={() => setChangelogOpen(true)}
          >
            {formatBuildStamp(lang)}
          </button>
        </div>
      </footer>
      <Toaster toasts={app.toasts} onDismiss={app.dismissToast} />
      <InstallOutlookWizard
        open={app.installWizardOpen}
        phase={app.installWizardPhase}
        lang={lang}
        working={app.installWizardWorking}
        saveResult={app.installWizardSave}
        restartOutlook={app.installRestartOutlook}
        installFont={app.installFontOnPc}
        showFontOption={app.showInstallFontOption}
        canSaveAs={app.canPickInstallSaveLocation}
        rasterizeNameTitle={app.form.rasterizeNameTitle}
        bundledFontName={app.installBundledFontName}
        onRestartOutlookChange={app.setInstallRestartOutlook}
        onInstallFontChange={app.setInstallFontOnPc}
        onDownload={() => {
          app.confirmInstallDownload().catch(() => undefined)
        }}
        onSaveAs={() => {
          app.confirmInstallSaveAs().catch(() => undefined)
        }}
        onNewOutlook={() => {
          app.handleInstallNewOutlook()
            .catch(() => undefined)
            .finally(() => app.closeInstallWizard())
        }}
        onOpenDownloads={app.handleOpenInstallDownloads}
        onClose={app.closeInstallWizard}
      />
      <ChangelogModal open={changelogOpen} lang={lang} onClose={() => setChangelogOpen(false)} />
      <CreatorModal open={creatorOpen} lang={lang} onClose={() => setCreatorOpen(false)} />
      <UpdatePrompt lang={lang} />
      <footer className="ui-classic-only app-footer">
        <button type="button" className="app-footer-creator" onClick={() => setCreatorOpen(true)}>
          {t(lang, 'creatorFooter').replace('{name}', CREATOR_NAME)}
        </button>
      </footer>
      <button
        type="button"
        className="ui-classic-only build-stamp"
        title={t(lang, 'changelogTitle')}
        aria-label={t(lang, 'changelogTitle')}
        onClick={() => setChangelogOpen(true)}
      >
        {formatBuildStamp(lang)}
      </button>
    </main>
  )
}
