import { useRef, useState } from 'react'
import { Panel } from './Panel'
import { t, type AppLanguage } from '../i18n'
import {
  bulkErrorMessageKey,
  downloadBlob,
  downloadBulkTemplate,
  generateBulkSignaturesZip,
  parseBulkErrorCode,
  parseBulkSpreadsheet
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
  const [lastCount, setLastCount] = useState<number | null>(null)

  const statusClass =
    statusTone === 'success' ? 'ai-status is-success' : statusTone === 'error' ? 'ai-status is-error' : 'ai-status'

  const runBulk = async (file: File) => {
    setWorking(true)
    setStatus(t(lang, 'bulkWorking'))
    setStatusTone('idle')

    try {
      const buffer = await file.arrayBuffer()
      const rows = parseBulkSpreadsheet(buffer, lang)
      const zip = await generateBulkSignaturesZip(template, rows)
      downloadBlob(zip, 'signatures.zip')
      setLastCount(rows.length)
      setStatus(
        rows.length === 1
          ? t(lang, 'bulkSuccessOne')
          : t(lang, 'bulkSuccessMany').replace('{count}', String(rows.length))
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
              if (file) runBulk(file)
            }}
          />
        </label>
      </div>
      {lastCount !== null && !working && statusTone !== 'error' && (
        <p className="hint">{t(lang, 'bulkUsesCurrentDesign')}</p>
      )}
      {status && <p className={statusClass}>{status}</p>}
    </Panel>
  )
}
