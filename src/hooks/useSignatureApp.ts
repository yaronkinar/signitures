import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildAiBriefPresets,
  buildAiCreatePresets,
  presetPromptsFromList
} from '../aiBriefPresets'
import {
  designSignatureWithAi,
  extractSignatureFromImageWithAi,
  hasConfiguredAiApiKey,
  isUsingEnvApiKey,
  isUsingServerAiProxy,
  loadStoredApiKey,
  storeApiKey
} from '../aiAgent'
import type { AiDesignMode } from '../aiSignatureDesign'
import { applyAiSignatureDesignToState } from '../lib/applyAiDesignState'
import { clearStoredFormState, createInitialFormState, storeFormState } from '../lib/formStorage'
import { createDefaultFormState } from '../lib/defaultFormState'
import {
  downloadHtmlOutput,
  downloadOpenSignaturesFolderBat,
  downloadOutlookInstaller,
  installForNewOutlook
} from '../lib/outlookInstall'
import { buildSignatureHtml } from '../lib/signatureHtmlBuilder'
import { initializeSocialIconDataUrls } from '../lib/socialIcons'
import {
  alignForHebrew,
  fileToDataUrl,
  formToSnapshot,
  getDefaultDesignSnapshot,
  getLayoutSettings,
  wrapHtmlDocument
} from '../lib/signatureUtils'
import { t, type AppLanguage } from '../i18n'
import { useToasts } from './useToasts'
import type { LinkImage, SignatureFormState } from '../types/signatureForm'

export type AiStatusTone = 'idle' | 'working' | 'success' | 'error'
const MAX_SIGNATURE_IMAGE_BYTES = 5 * 1024 * 1024

export const useSignatureApp = () => {
  const { toasts, addToast, dismissToast } = useToasts()
  const [form, setForm] = useState<SignatureFormState>(createInitialFormState)
  const [outputHtml, setOutputHtml] = useState('')
  const [layout, setLayout] = useState(() => getLayoutSettings(createInitialFormState()))
  const [previewOpen, setPreviewOpen] = useState(true)
  const [previewHighlight, setPreviewHighlight] = useState(false)
  const [showAiPreview, setShowAiPreview] = useState(false)

  const [aiBrief, setAiBrief] = useState('')
  const [aiApiKey, setAiApiKey] = useState(loadStoredApiKey)
  const [aiMode, setAiMode] = useState<AiDesignMode>('refine')
  const [aiKeepContact, setAiKeepContact] = useState(true)
  const [aiStatus, setAiStatus] = useState('')
  const [aiStatusTone, setAiStatusTone] = useState<AiStatusTone>('idle')
  const [aiWorking, setAiWorking] = useState(false)
  const [imageImportStatus, setImageImportStatus] = useState('')
  const [imageImportStatusTone, setImageImportStatusTone] = useState<AiStatusTone>('idle')
  const [imageImportWorking, setImageImportWorking] = useState(false)
  const previewCardRef = useRef<HTMLElement>(null)
  const debounceRef = useRef<number | null>(null)
  const saveDebounceRef = useRef<number | null>(null)
  const skipNextSaveToastRef = useRef(true)

  const lang = form.signatureLanguage

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
    document.title = t(lang, 'pageTitle')
  }, [lang])

  const generate = useCallback(async (state = form) => {
    await initializeSocialIconDataUrls()
    const nextLayout = getLayoutSettings(state)
    const html = buildSignatureHtml(state, nextLayout)
    setLayout(nextLayout)
    setOutputHtml(html)
    return html
  }, [form])

  useEffect(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null
      generate().catch(() => undefined)
    }, 120)
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [form, generate])

  useEffect(() => {
    if (saveDebounceRef.current !== null) {
      window.clearTimeout(saveDebounceRef.current)
    }
    saveDebounceRef.current = window.setTimeout(() => {
      saveDebounceRef.current = null
      const saved = storeFormState(form)
      if (skipNextSaveToastRef.current) {
        skipNextSaveToastRef.current = false
        return
      }
      addToast(
        saved ? t(form.signatureLanguage, 'formSaved') : t(form.signatureLanguage, 'formSaveFailed'),
        saved ? 'success' : 'error'
      )
    }, 400)
    return () => {
      if (saveDebounceRef.current !== null) {
        window.clearTimeout(saveDebounceRef.current)
      }
    }
  }, [form, addToast])

  const updateForm = useCallback((patch: Partial<SignatureFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleLanguageChange = useCallback((nextLang: AppLanguage) => {
    setForm((prev) => {
      const updated = { ...prev, signatureLanguage: nextLang }
      return nextLang === 'he' ? alignForHebrew(updated) : updated
    })
  }, [])

  const handleFileToField = useCallback(
    async (file: File | undefined, field: keyof SignatureFormState) => {
      if (!file) return
      try {
        const dataUrl = await fileToDataUrl(file)
        if (dataUrl) updateForm({ [field]: dataUrl } as Partial<SignatureFormState>)
      } catch {
        // Keep current value.
      }
    },
    [updateForm]
  )

  const addLinkImage = useCallback((seed?: Partial<LinkImage>) => {
    const id = crypto.randomUUID()
    setForm((prev) => ({
      ...prev,
      linkImages: [
        ...prev.linkImages,
        {
          id,
          imageUrl: seed?.imageUrl ?? '',
          href: seed?.href ?? '',
          alt: seed?.alt ?? t(prev.signatureLanguage, 'linkedImageAlt')
        }
      ]
    }))
  }, [])

  const updateLinkImage = useCallback((id: string, patch: Partial<LinkImage>) => {
    setForm((prev) => ({
      ...prev,
      linkImages: prev.linkImages.map((row) => (row.id === id ? { ...row, ...patch } : row))
    }))
  }, [])

  const removeLinkImage = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      linkImages: prev.linkImages.filter((row) => row.id !== id)
    }))
  }, [])

  const revealSignaturePreview = useCallback((options?: { scrollToMain?: boolean; showInline?: boolean }) => {
    const scrollToMain = options?.scrollToMain ?? true
    const showInline = options?.showInline ?? true
    if (showInline) setShowAiPreview(true)
    setPreviewOpen(true)
    if (scrollToMain) {
      setPreviewHighlight(true)
      window.setTimeout(() => setPreviewHighlight(false), 2200)
      window.requestAnimationFrame(() => {
        previewCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }, [])

  const aiPresets = useMemo(() => {
    const snapshot = formToSnapshot(form)
    return aiMode === 'create'
      ? buildAiCreatePresets(lang)
      : buildAiBriefPresets(snapshot, {
          hasLogo: Boolean(form.logoUrl.trim()),
          hasBanner: Boolean(form.bannerUrl.trim()),
          hasSocial: [
            form.facebookUrl,
            form.instagramUrl,
            form.linkedinUrl,
            form.xUrl,
            form.youtubeUrl
          ].some((url) => url.trim().length > 0),
          hasWebsite: Boolean(snapshot.website.trim())
        })
  }, [aiMode, form, lang])

  const aiPresetPrompts = useMemo(() => presetPromptsFromList(aiPresets), [aiPresets])

  const buildAiRequestSnapshot = useCallback(
    (mode: AiDesignMode, keepContact: boolean) => {
      if (mode === 'refine') return formToSnapshot(form)
      const defaults = getDefaultDesignSnapshot(lang)
      if (!keepContact) return defaults
      const current = formToSnapshot(form)
      return {
        ...defaults,
        signatureLanguage: current.signatureLanguage,
        fullName: current.fullName,
        jobTitle: current.jobTitle,
        company: current.company,
        phone: current.phone,
        email: current.email,
        website: current.website
      }
    },
    [form, lang]
  )

  const runAiDesign = useCallback(
    async (mode: AiDesignMode) => {
      const brief = aiBrief.trim()
      if (!brief) {
        setAiStatus(t(lang, 'aiDesignMissingBrief'))
        setAiStatusTone('error')
        return
      }

      storeApiKey(aiApiKey)
      if (!hasConfiguredAiApiKey(aiApiKey)) {
        setAiStatus(t(lang, 'aiDesignMissingApiKey'))
        setAiStatusTone('error')
        return
      }

      const keepContact = mode === 'refine' || aiKeepContact
      if (mode === 'create') {
        setForm((prev) => {
          let next = {
            ...prev,
            facebookUrl: '',
            instagramUrl: '',
            linkedinUrl: '',
            xUrl: '',
            youtubeUrl: ''
          }
          if (!keepContact) {
            next = { ...next, fullName: '', jobTitle: '', company: '', phone: '', email: '', website: '' }
          }
          return next
        })
      }

      setAiWorking(true)
      setAiStatus(t(lang, 'aiDesignWorking'))
      setAiStatusTone('working')

      try {
        const snapshot = buildAiRequestSnapshot(mode, keepContact)
        const design = await designSignatureWithAi(brief, snapshot, {
          apiKey: aiApiKey,
          mode,
          keepContact
        })
        setForm((prev) => applyAiSignatureDesignToState(prev, design))
        await generate()
        revealSignaturePreview({ scrollToMain: true, showInline: true })
        const successPrefix =
          mode === 'create' ? t(lang, 'aiCreateSuccess') : t(lang, 'aiDesignSuccess')
        setAiStatus(`${successPrefix} ${design.designSummary}`)
        setAiStatusTone('success')
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setAiStatus(`${t(lang, 'aiDesignFailed')} ${message}`)
        setAiStatusTone('error')
      } finally {
        setAiWorking(false)
      }
    },
    [
      aiApiKey,
      aiBrief,
      aiKeepContact,
      buildAiRequestSnapshot,
      generate,
      lang,
      revealSignaturePreview
    ]
  )

  const runImageImport = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      if (file.size > MAX_SIGNATURE_IMAGE_BYTES) {
        setImageImportStatus(t(lang, 'imageImportTooLarge'))
        setImageImportStatusTone('error')
        return
      }

      storeApiKey(aiApiKey)
      if (!hasConfiguredAiApiKey(aiApiKey)) {
        setImageImportStatus(t(lang, 'aiDesignMissingApiKey'))
        setImageImportStatusTone('error')
        return
      }

      setImageImportWorking(true)
      setImageImportStatus(t(lang, 'imageImportWorking'))
      setImageImportStatusTone('working')

      try {
        const imageDataUrl = await fileToDataUrl(file)
        const design = await extractSignatureFromImageWithAi(imageDataUrl, { apiKey: aiApiKey })
        let nextForm: SignatureFormState | undefined
        setForm((prev) => {
          nextForm = applyAiSignatureDesignToState(
            { ...prev, fullName: '', jobTitle: '', company: '', phone: '', email: '', website: '' },
            design
          )
          return nextForm
        })
        await generate(nextForm)
        revealSignaturePreview({ scrollToMain: true, showInline: true })
        setImageImportStatus(`${t(lang, 'imageImportSuccess')} ${design.designSummary}`)
        setImageImportStatusTone('success')
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setImageImportStatus(`${t(lang, 'imageImportFailed')} ${message}`)
        setImageImportStatusTone('error')
      } finally {
        setImageImportWorking(false)
      }
    },
    [aiApiKey, generate, lang, revealSignaturePreview]
  )

  const apiKeyPlaceholder = isUsingServerAiProxy(aiApiKey)
    ? t(lang, 'aiApiKeyUsingServer')
    : isUsingEnvApiKey(aiApiKey)
      ? t(lang, 'aiApiKeyUsingEnv')
      : t(lang, 'aiApiKeyPlaceholder')

  const copyOutput = useCallback(async () => {
    const value = outputHtml.trim()
    if (!value) return
    await navigator.clipboard.writeText(value)
  }, [outputHtml])

  const handleDownload = useCallback(() => {
    const value = outputHtml.trim()
    if (!value) return
    downloadHtmlOutput(value, lang)
  }, [lang, outputHtml])

  const handleInstallOutlook = useCallback(async () => {
    try {
      const html = outputHtml.trim() ? outputHtml : await generate()
      downloadOutlookInstaller(html, form)
      window.alert(t(lang, 'alertOutlookInstallSuccess'))
    } catch {
      window.alert(t(lang, 'alertOutlookInstallFailed'))
    }
  }, [form, generate, lang, outputHtml])

  const handleInstallNewOutlook = useCallback(async () => {
    try {
      const html = outputHtml.trim() ? outputHtml : await generate()
      await installForNewOutlook(html, lang)
    } catch {
      window.alert(t(lang, 'alertNewOutlookFailed'))
    }
  }, [generate, lang, outputHtml])

  const handleOpenSignaturesFolder = useCallback(() => {
    downloadOpenSignaturesFolderBat(lang)
  }, [lang])

  const applyAiPreset = useCallback(
    (presetId: string) => {
      const prompt = aiPresetPrompts.get(presetId)
      if (prompt) setAiBrief(prompt)
    },
    [aiPresetPrompts]
  )

  const resetFormToDefaults = useCallback(() => {
    if (!window.confirm(t(lang, 'resetFormConfirm'))) return
    clearStoredFormState()
    const defaults = createDefaultFormState()
    setForm(defaults)
    generate(defaults).catch(() => undefined)
  }, [generate, lang])

  return {
    form,
    updateForm,
    handleLanguageChange,
    handleFileToField,
    outputHtml,
    layout,
    previewOpen,
    setPreviewOpen,
    previewHighlight,
    previewCardRef,
    showAiPreview,
    aiBrief,
    setAiBrief,
    aiApiKey,
    setAiApiKey,
    apiKeyPlaceholder,
    aiMode,
    setAiMode,
    aiKeepContact,
    setAiKeepContact,
    aiStatus,
    aiStatusTone,
    aiWorking,
    imageImportStatus,
    imageImportStatusTone,
    imageImportWorking,
    aiPresets,
    applyAiPreset,
    runAiDesign,
    runImageImport,
    generate,
    copyOutput,
    handleDownload,
    handleInstallOutlook,
    handleInstallNewOutlook,
    handleOpenSignaturesFolder,
    addLinkImage,
    updateLinkImage,
    removeLinkImage,
    toasts,
    dismissToast,
    resetFormToDefaults,
    lang,
    wrapHtmlDocument: (body: string) => wrapHtmlDocument(body, lang)
  }
}
