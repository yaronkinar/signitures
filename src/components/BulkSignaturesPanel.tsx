import { useRef, useState } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [working, setWorking] = useState(false)
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'idle' | 'success' | 'error'>('idle')
  const [rows, setRows] = useState<BulkPersonRow[] | null>(null)
  const [previews, setPreviews] = useState<BulkSignaturePreview[] | null>(null)
  const [overrides, setOverrides] = useState<BulkRowFormOverrides>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const statusClass =
    statusTone === 'success' ? 'ai-status is-success' : statusTone === 'error' ? 'ai-status is-error' : 'ai-status'

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
    setStatus('')
    setStatusTone('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async (file: File) => {
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

  const downloadZip = async (forItOutlook: boolean) => {
    if (!rows?.length) return
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
