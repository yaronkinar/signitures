import { useRef, type CSSProperties, type ReactNode } from 'react'

type SubPanelProps = {
  summary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  style?: CSSProperties
}

export const SubPanel = ({
  summary,
  children,
  defaultOpen,
  className = '',
  style
}: SubPanelProps) => {
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
      className={`sub-panel ${className}`.trim()}
      open={defaultOpen}
      style={style}
      onToggle={handleToggle}
    >
      <summary>{summary}</summary>
      <div className="sub-panel-body">{children}</div>
    </details>
  )
}
