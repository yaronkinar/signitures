import { useRef, type CSSProperties, type ReactNode } from 'react'

type PanelProps = {
  summary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  style?: CSSProperties
  id?: string
  icon?: string
}

export const Panel = ({ summary, children, defaultOpen, className = '', style, id, icon }: PanelProps) => {
  const panelRef = useRef<HTMLDetailsElement>(null)

  const handleToggle = () => {
    const panel = panelRef.current
    if (!panel?.open) return
    requestAnimationFrame(() => {
      panel.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  }

  return (
    <details
      ref={panelRef}
      id={id}
      className={`panel ${className}`.trim()}
      open={defaultOpen}
      style={style}
      onToggle={handleToggle}
    >
      <summary>
        {icon ? (
          <span className="panel-summary-label">
            <span className="material-symbols-outlined panel-icon panel-icon--no-flip" aria-hidden="true">
              {icon}
            </span>
            <span>{summary}</span>
          </span>
        ) : (
          summary
        )}
      </summary>
      <div className="panel-body">{children}</div>
    </details>
  )
}
