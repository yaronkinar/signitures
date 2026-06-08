type PlacementControlProps = {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

export const PlacementControl = ({
  value,
  min,
  max,
  step = 1,
  onChange
}: PlacementControlProps) => (
  <div className="placement-control">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
)
