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
import {
  applyStyleImport,
  clearStoredFormState,
  createInitialFormState,
  downloadFormStateExport,
  downloadFormStyleExport,
  parseFormImportFile,
  storeFormState
} from '../lib/formStorage'
import { createDefaultFormState, createDefaultLinkImage } from '../lib/defaultFormState'
import {
  copySignatureForOutlookPaste,
  downloadHtmlOutput,
  downloadExportSignaturesFolderBat,
  downloadOpenDownloadsFolderBat,
  downloadOpenSignaturesFolderBat,
  canPickOutlookInstallerSaveLocation,
  installForNewOutlook,
  pickOutlookInstallerSaveLocation,
  saveOutlookInstaller,
  type OutlookInstallerSaveResult
} from '../lib/outlookInstall'
import { downloadWindowsFontInstaller } from '../lib/fontInstallScripts'
import { getBundledFontCssFamily, isBundledWebFont } from '../lib/signatureFonts'
import { buildSignatureHtml } from '../lib/signatureHtmlBuilder'
import { generateSignatureTextImages } from '../lib/signatureTextImages'
import {
  defaultSaveAsName,
  deleteSavedSignature,
  findSavedSignatureByName,
  listSavedSignatures,
  loadSavedSignatureForm,
  saveSignatureAs,
  type SavedSignatureEntry
} from '../lib/savedSignatures'
import {
  deleteCloudSignature,
  fetchCloudSignatures,
  findCloudSignatureByName,
  loadCloudSignatureForm,
  saveCloudSignature
} from '../lib/cloudSignatures'
import { initializeSocialIconDataUrls } from '../lib/socialIcons'
import { stripOutlookStoredAssetPathsFromForm } from '../lib/signatureImageAssets'
import {
  alignForHebrew,
  fileToDataUrl,
  formToSnapshot,
  getDefaultDesignSnapshot,
  getLayoutSettings,
  wrapHtmlDocument
} from '../lib/signatureUtils'
import { t, type AppLanguage } from '../i18n'
import { useFormHistory } from './useFormHistory'
import { useToasts } from './useToasts'
import type { LinkImage, SignatureFormState } from '../types/signatureForm'

export type AiStatusTone = 'idle' | 'working' | 'success' | 'error'
const MAX_SIGNATURE_IMAGE_BYTES = 5 * 1024 * 1024

export const useSignatureApp = () => {
  const { toasts, addToast, dismissToast } = useToasts()
  const {
    form,
    setForm,
    updateForm,
    undo,
    redo,
    canUndo,
    canRedo,
    historyVersion
  } = useFormHistory(createInitialFormState())
  const [outputHtml, setOutputHtml] = useState('')
  const [layout, setLayout] = useState(() => getLayoutSettings(createInitialFormState()))
  const [previewOpen, setPreviewOpen] = useState(true)
  const [previewHighlight, setPreviewHighlight] = useState(false)
  const [installWizardOpen, setInstallWizardOpen] = useState(false)
  const [installWizardPhase, setInstallWizardPhase] = useState<'options' | 'running' | 'done'>('options')
  const [installWizardWorking, setInstallWizardWorking] = useState(false)
  const [installWizardSave, setInstallWizardSave] = useState<OutlookInstallerSaveResult | null>(null)
  const [installRestartOutlook, setInstallRestartOutlook] = useState(true)
  const [installFontOnPc, setInstallFontOnPc] = useState(false)
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
  const [savedSignatures, setSavedSignatures] = useState<SavedSignatureEntry[]>(() =>
    listSavedSignatures()
  )
  const [activeSavedId, setActiveSavedId] = useState('')
  const [saveAsName, setSaveAsName] = useState('')
  const [cloudStorageAvailable, setCloudStorageAvailable] = useState(false)
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

  useEffect(() => {
    initializeSocialIconDataUrls().catch(() => undefined)
  }, [])

  const generate = useCallback(async (state = form) => {
    await initializeSocialIconDataUrls()
    const readyForm = stripOutlookStoredAssetPathsFromForm(state)
    const nextLayout = getLayoutSettings(readyForm)
    const textImages = await generateSignatureTextImages(readyForm, nextLayout)
    const html = buildSignatureHtml(readyForm, nextLayout, { textImages })
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

  const handleLanguageChange = useCallback(
    (nextLang: AppLanguage) => {
      setForm(
        (prev) => {
          const updated = { ...prev, signatureLanguage: nextLang }
          return nextLang === 'he' ? alignForHebrew(updated) : updated
        },
        { immediate: true }
      )
    },
    [setForm]
  )

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

  const addLinkImage = useCallback(
    (seed?: Partial<LinkImage>) => {
      setForm(
        (prev) => ({
          ...prev,
          linkImages: [
            ...prev.linkImages,
            createDefaultLinkImage({
              ...seed,
              alt: seed?.alt ?? t(prev.signatureLanguage, 'linkedImageAlt'),
              align: seed?.align ?? prev.nameTitleAlign
            })
          ]
        }),
        { immediate: true }
      )
    },
    [setForm]
  )

  const updateLinkImage = useCallback(
    (id: string, patch: Partial<LinkImage>) => {
      setForm((prev) => ({
        ...prev,
        linkImages: prev.linkImages.map((row) => (row.id === id ? { ...row, ...patch } : row))
      }))
    },
    [setForm]
  )

  const removeLinkImage = useCallback(
    (id: string) => {
      setForm(
        (prev) => ({
          ...prev,
          linkImages: prev.linkImages.filter((row) => row.id !== id)
        }),
        { immediate: true }
      )
    },
    [setForm]
  )

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
        setForm(
          (prev) => {
            let next = {
              ...prev,
              facebookUrl: '',
              instagramUrl: '',
              linkedinUrl: '',
              xUrl: '',
              youtubeUrl: ''
            }
            if (!keepContact) {
              next = {
                ...next,
                fullName: '',
                jobTitle: '',
                company: '',
                phone: '',
                email: '',
                website: ''
              }
            }
            return next
          },
          { immediate: true }
        )
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
        setForm((prev) => applyAiSignatureDesignToState(prev, design), { immediate: true })
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
        setForm(
          (prev) => {
            nextForm = applyAiSignatureDesignToState(
              { ...prev, fullName: '', jobTitle: '', company: '', phone: '', email: '', website: '' },
              design
            )
            return nextForm
          },
          { immediate: true }
        )
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
    const richCopied = await copySignatureForOutlookPaste(value, form)
    if (!richCopied) {
      await navigator.clipboard.writeText(value)
    }
  }, [form, outputHtml])

  const handleDownload = useCallback(async () => {
    const value = outputHtml.trim()
    if (!value) return
    await downloadHtmlOutput(value, lang, form.fontFamily, form)
  }, [form, lang, outputHtml])

  const openInstallWizard = useCallback(() => {
    setInstallWizardPhase('options')
    setInstallWizardSave(null)
    setInstallRestartOutlook(true)
    setInstallFontOnPc(!form.rasterizeNameTitle && isBundledWebFont(form.fontFamily))
    setInstallWizardOpen(true)
  }, [form.fontFamily, form.rasterizeNameTitle])

  const closeInstallWizard = useCallback(() => {
    setInstallWizardOpen(false)
    setInstallWizardWorking(false)
  }, [])

  const confirmInstallDownload = useCallback(async () => {
    setInstallWizardWorking(true)
    setInstallWizardPhase('running')
    try {
      const html = await generate()
      const result = await saveOutlookInstaller(html, form, {
        restartOutlook: installRestartOutlook,
        installFont: installFontOnPc && isBundledWebFont(form.fontFamily),
        autoRun: true
      })
      setInstallWizardSave(result)
      setInstallWizardPhase('done')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setInstallWizardPhase('options')
        return
      }
      setInstallWizardPhase('options')
      window.alert(t(lang, 'alertOutlookInstallFailed'))
    } finally {
      setInstallWizardWorking(false)
    }
  }, [form, generate, installFontOnPc, installRestartOutlook, lang])

  const confirmInstallSaveAs = useCallback(async () => {
    setInstallWizardWorking(true)
    setInstallWizardPhase('running')
    try {
      let fileHandle: FileSystemFileHandle | undefined
      if (canPickOutlookInstallerSaveLocation()) {
        try {
          fileHandle = await pickOutlookInstallerSaveLocation()
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            setInstallWizardPhase('options')
            return
          }
        }
      }
      const html = await generate()
      const result = await saveOutlookInstaller(html, form, {
        restartOutlook: installRestartOutlook,
        installFont: installFontOnPc && isBundledWebFont(form.fontFamily),
        autoRun: false,
        fileHandle
      })
      setInstallWizardSave(result)
      setInstallWizardPhase('done')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setInstallWizardPhase('options')
        return
      }
      setInstallWizardPhase('options')
      window.alert(t(lang, 'alertOutlookInstallFailed'))
    } finally {
      setInstallWizardWorking(false)
    }
  }, [form, generate, installFontOnPc, installRestartOutlook, lang])

  const handleOpenInstallDownloads = useCallback(() => {
    downloadOpenDownloadsFolderBat(lang)
  }, [lang])

  const handleInstallOutlook = openInstallWizard

  const handleInstallWindowsFont = useCallback(async () => {
    try {
      await downloadWindowsFontInstaller(form)
      window.alert(t(lang, 'alertWindowsFontInstallSuccess'))
    } catch {
      window.alert(t(lang, 'alertWindowsFontInstallFailed'))
    }
  }, [form, lang])

  const handleInstallNewOutlook = useCallback(async () => {
    try {
      const html = outputHtml.trim() ? outputHtml : await generate()
      await installForNewOutlook(html, lang, form)
    } catch {
      window.alert(t(lang, 'alertNewOutlookFailed'))
    }
  }, [generate, lang, outputHtml])

  const handleOpenSignaturesFolder = useCallback(() => {
    downloadOpenSignaturesFolderBat(lang)
  }, [lang])

  const handleExportSignaturesZip = useCallback(async () => {
    const html = outputHtml.trim() ? outputHtml : await generate()
    await downloadExportSignaturesFolderBat(html, form)
  }, [form, generate, outputHtml])

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
    setForm(defaults, { immediate: true })
    generate(defaults).catch(() => undefined)
  }, [generate, lang, setForm])

  const refreshSavedSignatures = useCallback(async () => {
    try {
      const cloud = await fetchCloudSignatures()
      setCloudStorageAvailable(cloud.available)
      if (cloud.available) {
        setSavedSignatures(cloud.entries)
        return
      }
    } catch {
      setCloudStorageAvailable(false)
    }
    setSavedSignatures(listSavedSignatures())
  }, [])

  useEffect(() => {
    refreshSavedSignatures().catch(() => undefined)
  }, [refreshSavedSignatures])

  const handleSaveAs = useCallback(async () => {
    const name = saveAsName.trim() || defaultSaveAsName(form)

    if (cloudStorageAvailable) {
      const existing = findCloudSignatureByName(savedSignatures, name)
      if (existing && !window.confirm(t(lang, 'saveAsOverwriteConfirm'))) {
        return
      }

      const result = await saveCloudSignature(name, form, existing?.id)
      if (!result.ok) {
        const messageKey =
          result.reason === 'too_many'
            ? 'saveAsFailedTooMany'
            : result.reason === 'too_large'
              ? 'saveAsCloudTooLarge'
              : 'saveAsFailedStorage'
        addToast(t(lang, messageKey), 'error')
        return
      }

      await refreshSavedSignatures()
      setActiveSavedId(result.entry.id)
      setSaveAsName(result.entry.name)
      addToast(t(lang, 'saveAsCloudSuccess').replace('{name}', result.entry.name), 'success')
      return
    }

    const existing = findSavedSignatureByName(name)
    if (existing && !window.confirm(t(lang, 'saveAsOverwriteConfirm'))) {
      return
    }

    const result = saveSignatureAs(name, form, {
      overwriteId: existing?.id
    })

    if (!result.ok) {
      const messageKey =
        result.reason === 'too_many' ? 'saveAsFailedTooMany' : 'saveAsFailedStorage'
      addToast(t(lang, messageKey), 'error')
      return
    }

    await refreshSavedSignatures()
    setActiveSavedId(result.entry.id)
    setSaveAsName(result.entry.name)
    addToast(t(lang, 'saveAsSuccess').replace('{name}', result.entry.name), 'success')
  }, [
    addToast,
    cloudStorageAvailable,
    form,
    lang,
    refreshSavedSignatures,
    saveAsName,
    savedSignatures
  ])

  const handleLoadSaved = useCallback(
    async (id: string) => {
      if (!id) {
        setActiveSavedId('')
        return
      }

      const loaded = cloudStorageAvailable
        ? await loadCloudSignatureForm(id)
        : loadSavedSignatureForm(id)
      if (!loaded) {
        addToast(t(lang, 'savedLoadFailed'), 'error')
        refreshSavedSignatures()
        setActiveSavedId('')
        return
      }

      skipNextSaveToastRef.current = true
      setActiveSavedId(id)
      const entry = savedSignatures.find((item) => item.id === id)
      if (entry) setSaveAsName(entry.name)
      setForm(loaded, { immediate: true })
      await generate(loaded)
      addToast(t(lang, 'savedLoadSuccess'), 'success')
    },
    [addToast, cloudStorageAvailable, generate, lang, refreshSavedSignatures, savedSignatures, setForm]
  )

  const handleDeleteSaved = useCallback(async () => {
    if (!activeSavedId) return
    if (!window.confirm(t(lang, 'savedDeleteConfirm'))) return

    const deleted = cloudStorageAvailable
      ? await deleteCloudSignature(activeSavedId)
      : deleteSavedSignature(activeSavedId)

    if (!deleted) {
      addToast(t(lang, 'savedLoadFailed'), 'error')
      return
    }

    setActiveSavedId('')
    await refreshSavedSignatures()
    addToast(t(lang, 'savedDeleteSuccess'), 'success')
  }, [activeSavedId, addToast, cloudStorageAvailable, lang, refreshSavedSignatures])

  const handleExportParams = useCallback(async () => {
    await downloadFormStateExport(form)
    addToast(t(lang, 'paramsExportSuccess'), 'success')
  }, [addToast, form, lang])

  const handleExportStyle = useCallback(async () => {
    await downloadFormStyleExport(form)
    addToast(t(lang, 'paramsStyleExportSuccess'), 'success')
  }, [addToast, form, lang])

  const handleImportParams = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      try {
        const imported = await parseFormImportFile(file)
        if (!imported) {
          addToast(t(lang, 'paramsImportFailed'), 'error')
          return
        }

        skipNextSaveToastRef.current = true
        const nextForm =
          imported.kind === 'style' ? applyStyleImport(form, imported.style) : imported.form
        setForm(nextForm, { immediate: true })
        await generate(nextForm)
        addToast(
          t(lang, imported.kind === 'style' ? 'paramsStyleImportSuccess' : 'paramsImportSuccess'),
          'success'
        )
      } catch {
        addToast(t(lang, 'paramsImportFailed'), 'error')
      }
    },
    [addToast, form, generate, lang, setForm]
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }
      const mod = event.ctrlKey || event.metaKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        if (!canUndo) return
        event.preventDefault()
        undo()
      } else if (key === 'z' && event.shiftKey) {
        if (!canRedo) return
        event.preventDefault()
        redo()
      } else if (key === 'y') {
        if (!canRedo) return
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canRedo, canUndo, redo, undo, historyVersion])

  return {
    form,
    setForm,
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
    installWizardOpen,
    installWizardPhase,
    installWizardWorking,
    installWizardSave,
    installRestartOutlook,
    setInstallRestartOutlook,
    installFontOnPc,
    setInstallFontOnPc,
    closeInstallWizard,
    confirmInstallDownload,
    confirmInstallSaveAs,
    canPickInstallSaveLocation: canPickOutlookInstallerSaveLocation(),
    handleOpenInstallDownloads,
    installBundledFontName: getBundledFontCssFamily(form.fontFamily),
    showInstallFontOption: isBundledWebFont(form.fontFamily),
    handleInstallWindowsFont,
    handleOpenSignaturesFolder,
    handleExportSignaturesZip,
    addLinkImage,
    updateLinkImage,
    removeLinkImage,
    toasts,
    dismissToast,
    resetFormToDefaults,
    savedSignatures,
    activeSavedId,
    cloudStorageAvailable,
    saveAsName,
    setSaveAsName,
    saveAsNamePlaceholder: defaultSaveAsName(form),
    handleSaveAs,
    handleLoadSaved,
    handleDeleteSaved,
    handleExportParams,
    handleExportStyle,
    handleImportParams,
    undo,
    redo,
    canUndo,
    canRedo,
    lang,
    wrapHtmlDocument: (body: string) => wrapHtmlDocument(body, lang, form.fontFamily)
  }
}
