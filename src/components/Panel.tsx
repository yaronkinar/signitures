import type { CSSProperties, ReactNode } from 'react'

type PanelProps = {
  summary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  style?: CSSProperties
}

export const Panel = ({ summary, children, defaultOpen, className = '', style }: PanelProps) => (
  <details className={`panel ${className}`.trim()} open={defaultOpen} style={style}>
    <summary>{summary}</summary>
    <div className="panel-body">{children}</div>
  </details>
)
