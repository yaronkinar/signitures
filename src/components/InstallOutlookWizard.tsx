import { t, type AppLanguage } from '../i18n'
import type { OutlookInstallerSaveResult } from '../lib/outlookInstall'

type InstallOutlookWizardProps = {
  open: boolean
  phase: 'options' | 'running' | 'done'
  lang: AppLanguage
  working: boolean
  saveResult: OutlookInstallerSaveResult | null
  restartOutlook: boolean
  installFont: boolean
  showFontOption: boolean
  canSaveAs: boolean
  rasterizeNameTitle: boolean
  bundledFontName: string | null
  onRestartOutlookChange: (value: boolean) => void
  onInstallFontChange: (value: boolean) => void
  onDownload: () => void
  onSaveAs: () => void
  onNewOutlook: () => void
  onOpenDownloads: () => void
  onClose: () => void
}

export const InstallOutlookWizard = ({
  open,
  phase,
  lang,
  working,
  saveResult,
  restartOutlook,
  installFont,
  showFontOption,
  canSaveAs,
  rasterizeNameTitle,
  bundledFontName,
  onRestartOutlookChange,
  onInstallFontChange,
  onDownload,
  onSaveAs,
  onNewOutlook,
  onOpenDownloads,
  onClose
}: InstallOutlookWizardProps) => {
  if (!open) return null

  const dir = lang === 'he' ? 'rtl' : 'ltr'

  return (
    <div className="install-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="install-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-wizard-title"
        dir={dir}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="install-wizard-header">
          <h2 id="install-wizard-title">{t(lang, 'installWizardTitle')}</h2>
          <button type="button" className="install-wizard-close" onClick={onClose} aria-label={t(lang, 'installWizardClose')}>
            ×
          </button>
        </div>

        <p className="hint install-wizard-intro">
          {phase === 'options' ? t(lang, 'installWizardIntro') : null}
        </p>

        {phase === 'options' ? (
          <div className="install-wizard-body">
            <label className="install-wizard-option">
              <input
                type="checkbox"
                checked={restartOutlook}
                onChange={(event) => onRestartOutlookChange(event.target.checked)}
              />
              <span>{t(lang, 'installWizardRestartOutlook')}</span>
            </label>

            {showFontOption && bundledFontName ? (
              <label className="install-wizard-option">
                <input
                  type="checkbox"
                  checked={installFont}
                  onChange={(event) => onInstallFontChange(event.target.checked)}
                />
                <span>{t(lang, 'installWizardInstallFont').replace('{font}', bundledFontName)}</span>
              </label>
            ) : null}

            {rasterizeNameTitle && showFontOption ? (
              <p className="hint install-wizard-font-skip">
                {t(lang, 'installWizardFontSkippedHint').replace('{font}', bundledFontName ?? '')}
              </p>
            ) : null}

            {canSaveAs ? (
              <p className="hint install-wizard-save-as-hint">{t(lang, 'installWizardSaveAsHint')}</p>
            ) : null}

            <div className="install-wizard-actions">
              <button type="button" className="primary" disabled={working} onClick={onDownload}>
                {working ? t(lang, 'installWizardDownloading') : t(lang, 'installWizardInstallNow')}
              </button>
              {canSaveAs ? (
                <button type="button" className="secondary" disabled={working} onClick={onSaveAs}>
                  {working ? t(lang, 'installWizardDownloading') : t(lang, 'installWizardSaveAs')}
                </button>
              ) : null}
              <button type="button" className="secondary" disabled={working} onClick={onNewOutlook}>
                {t(lang, 'newOutlookSetup')}
              </button>
              <button type="button" className="secondary" disabled={working} onClick={onClose}>
                {t(lang, 'installWizardClose')}
              </button>
            </div>
          </div>
        ) : phase === 'running' ? (
          <div className="install-wizard-body">
            <p className="install-wizard-saved">{t(lang, 'installWizardRunning')}</p>
            <div className="install-wizard-actions">
              <button type="button" className="secondary" onClick={onClose}>
                {t(lang, 'installWizardClose')}
              </button>
            </div>
          </div>
        ) : (
          <div className="install-wizard-body">
            <p className="install-wizard-saved">
              {saveResult?.usedSavePicker
                ? t(lang, 'installWizardSavedAs').replace('{file}', saveResult.fileName)
                : t(lang, 'installWizardSavedDownloads').replace('{file}', saveResult?.fileName ?? 'install-outlook-signature.bat')}
            </p>

            <ol className="install-wizard-steps">
              <li>
                {saveResult?.usedSavePicker
                  ? t(lang, 'installWizardStepRunFile')
                  : t(lang, 'installWizardStepAllowRun')}
              </li>
              <li>{t(lang, 'installWizardStepSmartScreen')}</li>
              <li>{restartOutlook ? t(lang, 'installWizardStepDoneRestart') : t(lang, 'installWizardStepDoneManual')}</li>
            </ol>

            <div className="install-guide-media install-wizard-gif">
              <img
                src="/images/install-outlook.gif"
                width={480}
                height={360}
                alt={t(lang, 'installGuideAlt')}
                loading="lazy"
              />
            </div>

            <div className="install-wizard-actions">
              {!saveResult?.usedSavePicker ? (
                <button type="button" className="secondary" onClick={onOpenDownloads}>
                  {t(lang, 'installWizardOpenDownloads')}
                </button>
              ) : null}
              <button type="button" className="primary" onClick={onClose}>
                {t(lang, 'installWizardClose')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
