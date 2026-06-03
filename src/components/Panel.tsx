import type { CSSProperties, ReactNode } from 'react'

type PanelProps = {
  summary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  style?: CSSProperties
  id?: string
}

export const Panel = ({ summary, children, defaultOpen, className = '', style, id }: PanelProps) => (
  <details id={id} className={`panel ${className}`.trim()} open={defaultOpen} style={style}>
    <summary>{summary}</summary>
    <div className="panel-body">{children}</div>
  </details>
)
