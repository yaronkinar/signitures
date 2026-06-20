import { useEffect, useRef, useState } from 'react'
import { useRequireSignIn } from '../hooks/useRequireSignIn'
import { useEntitlements } from '../hooks/useEntitlements'
import { usePaywallModal } from '../contexts/PaywallModalContext'
import { Panel } from './Panel'
import { t, type AppLanguage } from '../i18n'
import {
  bulkErrorMessageKey,
  buildBulkSignaturePreviewAt,
  buildBulkSignaturePreviews,
  cloneSignatureFormState,
  downloadBlob,
  downloadBulkTemplate,
  formToBulkPersonRow,
  generateBulkOutlookSignaturesZip,
  generateBulkSignaturesPngZip,
  generateBulkSignaturesZip,
  parseBulkErrorCode,
  parseBulkSpreadsheet,
  resolveBulkRowForm,
  type BulkPersonRow,
  type BulkRowFormOverrides,
  type BulkSignaturePreview
} from '../lib/bulkSignatures'
import {
  applyStyleImport,
  extractStyleFields,
  styleFieldsSignature,
  type SignatureStyleExport
} from '../lib/formStorage'
import { clearBulkState, loadBulkState, storeBulkState } from '../lib/bulkStorage'
import type { SignatureFormState } from '../types/signatureForm'
import type { SetFormOptions } from '../hooks/useFormHistory'

type BulkSignaturesPanelProps = {
  template: SignatureFormState
  designerForm: SignatureFormState
  lang: AppLanguage
  onLoadDesignerForm: (form: SignatureFormState, options?: SetFormOptions) => void
  onPreviewContentWidth?: (contentWidth: number) => void
}

export const BulkSignaturesPanel = ({
  template,
  designerForm,
  lang,
  onLoadDesignerForm,
  onPreviewContentWidth
}: BulkSignaturesPanelProps) => {
  const { ensureSignedIn } = useRequireSignIn()
  const { isPro, refresh } = useEntitlements()
  const { requestUnlock } = usePaywallModal()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [working, setWorking] = useState(false)
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'idle' | 'success' | 'error'>('idle')
  const [rows, setRows] = useState<BulkPersonRow[] | null>(null)
  const [previews, setPreviews] = useState<BulkSignaturePreview[] | null>(null)
  const [overrides, setOverrides] = useState<BulkRowFormOverrides>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  /** Style fields the current previews were built with (for design-change detection). */
  const [designStyle, setDesignStyle] = useState<Partial<SignatureStyleExport> | null>(null)
  /** Style signature the user dismissed, so the banner stays hidden until the next change. */
  const [dismissedSignature, setDismissedSignature] = useState<string | null>(null)
  const restoredRef = useRef(false)

  const ensureBulkUnlocked = async (): Promise<boolean> => {
    try {
      await ensureSignedIn()
    } catch {
      return false
    }
    if (isPro) return true
    // Re-fetch in case a teammate on the same tenant just upgraded to Pro.
    const fresh = await refresh()
    if (fresh.tier === 'pro') return true
    try {
      await requestUnlock({ kind: 'pro' })
      return true
    } catch {
      return false
    }
  }

  const statusClass =
    statusTone === 'success' ? 'ai-status is-success' : statusTone === 'error' ? 'ai-status is-error' : 'ai-status'

  const liveSignature = styleFieldsSignature(designerForm)
  const snapshotSignature = designStyle ? JSON.stringify(designStyle) : null
  const hasPreviews = Boolean(previews && previews.length > 0)
  const designChanged =
    hasPreviews && snapshotSignature !== null && liveSignature !== snapshotSignature
  const showDesignBanner =
    designChanged && editingIndex === null && !working && liveSignature !== dismissedSignature

  // Restore persisted bulk state on mount and rebuild previews from the snapshot design.
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    const stored = loadBulkState()
    if (!stored) return

    setRows(stored.rows)
    setOverrides(stored.overrides)
    setDesignStyle(stored.designStyle)
    setDismissedSignature(stored.dismissedSignature)

    const previewTemplate = applyStyleImport(template, stored.designStyle)
    setWorking(true)
    buildBulkSignaturePreviews(previewTemplate, stored.rows, stored.overrides)
      .then((built) => {
        setPreviews(built)
        const maxPreviewWidth = built.reduce((max, preview) => Math.max(max, preview.width), 0)
        onPreviewContentWidth?.(maxPreviewWidth)
      })
      .catch(() => undefined)
      .finally(() => setWorking(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist bulk state whenever it changes (skip until the restore pass has run).
  useEffect(() => {
    if (!restoredRef.current) return
    if (!rows || rows.length === 0 || !designStyle) {
      clearBulkState()
      return
    }
    storeBulkState({ rows, overrides, designStyle, dismissedSignature })
  }, [rows, overrides, designStyle, dismissedSignature])

  const scrollToDesigner = () => {
    const target = document.getElementById('contact-details-panel')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const clearPreviews = () => {
    setRows(null)
    setPreviews(null)
    setOverrides([])
    setEditingIndex(null)
    setDesignStyle(null)
    setDismissedSignature(null)
    setStatus('')
    setStatusTone('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async (file: File) => {
    if (!(await ensureBulkUnlocked())) return

    setWorking(true)
    setStatus(t(lang, 'bulkBuildingPreviews'))
    setStatusTone('idle')
    setRows(null)
    setPreviews(null)
    setOverrides([])
    setEditingIndex(null)

    try {
      const buffer = await file.arrayBuffer()
      const parsedRows = parseBulkSpreadsheet(buffer, lang)
      const builtPreviews = await buildBulkSignaturePreviews(template, parsedRows)
      setRows(parsedRows)
      setPreviews(builtPreviews)
      setOverrides(parsedRows.map(() => null))
      setDesignStyle(extractStyleFields(template))
      setDismissedSignature(null)
      const maxPreviewWidth = builtPreviews.reduce((max, preview) => Math.max(max, preview.width), 0)
      onPreviewContentWidth?.(maxPreviewWidth)
      setStatus(
        parsedRows.length === 1
          ? t(lang, 'bulkPreviewReadyOne')
          : t(lang, 'bulkPreviewReady').replace('{count}', String(parsedRows.length))
      )
      setStatusTone('success')
    } catch (error) {
      const code = parseBulkErrorCode(error)
      const key = bulkErrorMessageKey(code)
      const message = code === 'UNKNOWN' && error instanceof Error ? error.message : t(lang, key)
      setStatus(`${t(lang, 'bulkFailed')} ${message}`)
      setStatusTone('error')
    } finally {
      setWorking(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const startEditRow = (index: number) => {
    if (!rows) return
    const row = rows[index]
    const form = resolveBulkRowForm(template, row, overrides[index])
    onLoadDesignerForm(form, { immediate: true })
    setEditingIndex(index)
    setStatus(
      t(lang, 'bulkEditingHint').replace(
        '{name}',
        previews?.[index]?.label ?? (row.fullName.trim() || row.email.trim() || String(index + 1))
      )
    )
    setStatusTone('idle')
    scrollToDesigner()
  }

  const applyEditRow = async () => {
    if (editingIndex === null || !rows || !previews) return
    const index = editingIndex
    setWorking(true)

    try {
      const savedForm = cloneSignatureFormState(designerForm)
      const nextRows = [...rows]
      nextRows[index] = formToBulkPersonRow(savedForm)
      const nextOverrides = [...overrides]
      nextOverrides[index] = savedForm
      const preview = await buildBulkSignaturePreviewAt(template, nextRows, nextOverrides, index)
      const nextPreviews = [...previews]
      nextPreviews[index] = preview

      setRows(nextRows)
      setOverrides(nextOverrides)
      setPreviews(nextPreviews)
      setEditingIndex(null)
      setStatus(t(lang, 'bulkAppliedRow').replace('{name}', preview.label))
      setStatusTone('success')
    } catch (error) {
      const code = parseBulkErrorCode(error)
      const key = bulkErrorMessageKey(code)
      const message = code === 'UNKNOWN' && error instanceof Error ? error.message : t(lang, key)
      setStatus(`${t(lang, 'bulkFailed')} ${message}`)
      setStatusTone('error')
    } finally {
      setWorking(false)
    }
  }

  const applyDesignToAll = async () => {
    if (!rows) return
    setWorking(true)
    setStatus(t(lang, 'bulkBuildingPreviews'))
    setStatusTone('idle')

    try {
      const nextOverrides: BulkRowFormOverrides = rows.map(() => null)
      const builtPreviews = await buildBulkSignaturePreviews(template, rows, nextOverrides)
      setOverrides(nextOverrides)
      setPreviews(builtPreviews)
      setDesignStyle(extractStyleFields(template))
      setDismissedSignature(null)
      const maxPreviewWidth = builtPreviews.reduce((max, preview) => Math.max(max, preview.width), 0)
      onPreviewContentWidth?.(maxPreviewWidth)
      setStatus(t(lang, 'bulkDesignAppliedAll').replace('{count}', String(rows.length)))
      setStatusTone('success')
    } catch (error) {
      const code = parseBulkErrorCode(error)
      const key = bulkErrorMessageKey(code)
      const message = code === 'UNKNOWN' && error instanceof Error ? error.message : t(lang, key)
      setStatus(`${t(lang, 'bulkFailed')} ${message}`)
      setStatusTone('error')
    } finally {
      setWorking(false)
    }
  }

  const dismissDesignChange = () => {
    setDismissedSignature(liveSignature)
  }

  const downloadZip = async (forItOutlook: boolean) => {
    if (!rows?.length) return
    if (!(await ensureBulkUnlocked())) return
    setWorking(true)
    setStatus(t(lang, 'bulkWorking'))
    setStatusTone('idle')

    try {
      const zip = forItOutlook
        ? await generateBulkOutlookSignaturesZip(template, rows, overrides)
        : await generateBulkSignaturesZip(template, rows, overrides)
      downloadBlob(zip, forItOutlook ? 'outlook-signatures-for-it.zip' : 'signatures.zip')
      setStatus(
        rows.length === 1
          ? forItOutlook
            ? t(lang, 'bulkItSuccessOne')
            : t(lang, 'bulkSuccessOne')
          : (forItOutlook ? t(lang, 'bulkItSuccessMany') : t(lang, 'bulkSuccessMany')).replace(
              '{count}',
              String(rows.length)
            )
      )
      setStatusTone('success')
    } catch (error) {
      const code = parseBulkErrorCode(error)
      const key = bulkErrorMessageKey(code)
      const message = code === 'UNKNOWN' && error instanceof Error ? error.message : t(lang, key)
      setStatus(`${t(lang, 'bulkFailed')} ${message}`)
      setStatusTone('error')
    } finally {
      setWorking(false)
    }
  }

  const downloadPngZip = async () => {
    if (!rows?.length) return
    if (!(await ensureBulkUnlocked())) return
    setWorking(true)
    setStatus(t(lang, 'bulkWorking'))
    setStatusTone('idle')

    try {
      const zip = await generateBulkSignaturesPngZip(template, rows, overrides)
      downloadBlob(zip, 'signatures-png.zip')
      setStatus(
        rows.length === 1
          ? t(lang, 'bulkPngSuccessOne')
          : t(lang, 'bulkPngSuccessMany').replace('{count}', String(rows.length))
      )
      setStatusTone('success')
    } catch (error) {
      const code = parseBulkErrorCode(error)
      const key = bulkErrorMessageKey(code)
      const message = code === 'UNKNOWN' && error instanceof Error ? error.message : t(lang, key)
      setStatus(`${t(lang, 'bulkFailed')} ${message}`)
      setStatusTone('error')
    } finally {
      setWorking(false)
    }
  }

  return (
    <Panel id="panel-bulk" summary={t(lang, 'bulkSignatures')}>
      <p className="hint">{t(lang, 'bulkSignaturesLead')}</p>
      <p className="hint">{t(lang, 'bulkSignaturesColumns')}</p>
      <div className="bulk-actions">
        <button type="button" className="secondary" disabled={working} onClick={() => downloadBulkTemplate(lang)}>
          {t(lang, 'bulkDownloadTemplate')}
        </button>
        <label className="bulk-upload-label">
          <span className="primary bulk-upload-button">{t(lang, 'bulkUploadExcel')}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            hidden
            disabled={working}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
        </label>
        {previews && previews.length > 0 && (
          <>
            <button
              type="button"
              className="secondary"
              disabled={working}
              onClick={() => downloadZip(false)}
            >
              {t(lang, 'bulkDownloadZip')}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={working}
              onClick={() => {
                downloadPngZip().catch(() => undefined)
              }}
            >
              {t(lang, 'bulkDownloadPngZip')}
            </button>
            <button type="button" className="secondary" disabled={working} onClick={() => downloadZip(true)}>
              {t(lang, 'bulkDownloadItZip')}
            </button>
            {editingIndex !== null && (
              <button type="button" className="primary" disabled={working} onClick={() => applyEditRow()}>
                {t(lang, 'bulkApplyRow')}
              </button>
            )}
            <button type="button" className="secondary" disabled={working} onClick={clearPreviews}>
              {t(lang, 'bulkClearPreviews')}
            </button>
          </>
        )}
      </div>
      <p className="hint">{t(lang, 'bulkItHint')}</p>
      {previews && previews.length > 0 && !working && statusTone !== 'error' && editingIndex === null && (
        <p className="hint">{t(lang, 'bulkUsesCurrentDesign')}</p>
      )}
      {status && <p className={statusClass}>{status}</p>}
      {showDesignBanner && rows && (
        <div className="bulk-design-banner" role="status">
          <p className="bulk-design-banner-text">
            {t(lang, 'bulkDesignChanged').replace('{count}', String(rows.length))}
          </p>
          <div className="bulk-design-banner-actions">
            <button
              type="button"
              className="primary"
              disabled={working}
              onClick={() => {
                applyDesignToAll().catch(() => undefined)
              }}
            >
              {t(lang, 'bulkApplyDesignAll')}
            </button>
            <button type="button" className="secondary" disabled={working} onClick={dismissDesignChange}>
              {t(lang, 'bulkDismissDesignChange')}
            </button>
          </div>
        </div>
      )}
      {previews && previews.length > 0 && (
        <section
          className="bulk-previews"
          aria-label={t(lang, 'bulkPreviewHeading').replace('{count}', String(previews.length))}
        >
          <h3 className="bulk-previews-title">
            {t(lang, 'bulkPreviewHeading').replace('{count}', String(previews.length))}
          </h3>
          <div className="bulk-previews-grid">
            {previews.map((preview, index) => (
              <article
                key={preview.id}
                className={`bulk-preview-card${editingIndex === index ? ' is-editing' : ''}`}
              >
                <div className="bulk-preview-card-header">
                  <h4 className="bulk-preview-label">{preview.label}</h4>
                  {preview.customized && (
                    <span className="bulk-preview-badge">{t(lang, 'bulkRowCustomized')}</span>
                  )}
                </div>
                <div className="bulk-preview-frame">
                  <div
                    className="preview bulk-preview-signature"
                    style={{
                      width: `${preview.width}px`,
                      minHeight: `${preview.minHeight}px`,
                      height: 'auto',
                      textAlign: preview.emailAlign
                    }}
                    dangerouslySetInnerHTML={{ __html: preview.html }}
                  />
                </div>
                <div className="bulk-preview-card-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={working}
                    onClick={() => startEditRow(index)}
                  >
                    {t(lang, 'bulkEditRow')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </Panel>
  )
}
