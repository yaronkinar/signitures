import type { CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

type FieldProps = {
  label: ReactNode
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export const Field = ({ label, children, className, style }: FieldProps) => (
  <label className={className} style={style}>
    <span>{label}</span>
    {children}
  </label>
)

export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input type="text" {...props} />
)

export const SelectInput = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} />
)
