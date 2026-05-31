import { useEffect, useState } from 'react'
import { normalizeHexColor } from '../lib/signatureUtils'

type ColorInputProps = {
  value: string
  onChange: (value: string) => void
}

export const ColorInput = ({ value, onChange }: ColorInputProps) => {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commitDraft = () => {
    const normalized = normalizeHexColor(draft)
    if (normalized) {
      onChange(normalized)
      setDraft(normalized)
      return
    }
    setDraft(value)
  }

  return (
    <div className="color-input">
      <input
        type="color"
        value={value}
        aria-label={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        value={draft}
        placeholder="#88236f"
        spellCheck={false}
        autoComplete="off"
        dir="ltr"
        aria-label={value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commitDraft()
          }
        }}
      />
    </div>
  )
}
