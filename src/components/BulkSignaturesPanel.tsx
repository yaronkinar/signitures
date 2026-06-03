import { useRef, useState } from 'react'
import { Panel } from './Panel'
import { t, type AppLanguage } from '../i18n'
import {
  bulkErrorMessageKey,
  buildBulkSignaturePreviews,
  downloadBlob,
  downloadBulkTemplate,
  generateBulkOutlookSignaturesZip,
  generateBulkSignaturesZip,
  parseBulkErrorCode,
  parseBulkSpreadsheet,
  type BulkPersonRow,
  type BulkSignaturePreview
} from '../lib/bulkSignatures'
import type { SignatureFormState } from '../types/signatureForm'

type BulkSignaturesPanelProps = {
  template: SignatureFormState
  lang: AppLanguage
}

export const BulkSignaturesPanel = ({ template, lang }: BulkSignaturesPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [working, setWorking] = useState(false)
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'idle' | 'success' | 'error'>('idle')
  const [rows, setRows] = useState<BulkPersonRow[] | null>(null)
  const [previews, setPreviews] = useState<BulkSignaturePreview[] | null>(null)

  const statusClass =
    statusTone === 'success' ? 'ai-status is-success' : statusTone === 'error' ? 'ai-status is-error' : 'ai-status'

  const clearPreviews = () => {
    setRows(null)
    setPreviews(null)
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

    try {
      const buffer = await file.arrayBuffer()
      const parsedRows = parseBulkSpreadsheet(buffer, lang)
      const builtPreviews = await buildBulkSignaturePreviews(template, parsedRows)
      setRows(parsedRows)
      setPreviews(builtPreviews)
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

  const downloadZip = async (forItOutlook: boolean) => {
    if (!rows?.length) return
    setWorking(true)
    setStatus(t(lang, 'bulkWorking'))
    setStatusTone('idle')

    try {
      const zip = forItOutlook
        ? await generateBulkOutlookSignaturesZip(template, rows)
        : await generateBulkSignaturesZip(template, rows)
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

  return (
    <Panel summary={t(lang, 'bulkSignatures')}>
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
            <button type="button" className="secondary" disabled={working} onClick={() => downloadZip(true)}>
              {t(lang, 'bulkDownloadItZip')}
            </button>
            <button type="button" className="secondary" disabled={working} onClick={clearPreviews}>
              {t(lang, 'bulkClearPreviews')}
            </button>
          </>
        )}
      </div>
      <p className="hint">{t(lang, 'bulkItHint')}</p>
      {previews && previews.length > 0 && !working && statusTone !== 'error' && (
        <p className="hint">{t(lang, 'bulkUsesCurrentDesign')}</p>
      )}
      {status && <p className={statusClass}>{status}</p>}
      {previews && previews.length > 0 && (
        <section className="bulk-previews" aria-label={t(lang, 'bulkPreviewHeading').replace('{count}', String(previews.length))}>
          <h3 className="bulk-previews-title">
            {t(lang, 'bulkPreviewHeading').replace('{count}', String(previews.length))}
          </h3>
          <div className="bulk-previews-grid">
            {previews.map((preview) => (
              <article key={preview.id} className="bulk-preview-card">
                <h4 className="bulk-preview-label">{preview.label}</h4>
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
              </article>
            ))}
          </div>
        </section>
      )}
    </Panel>
  )
}
