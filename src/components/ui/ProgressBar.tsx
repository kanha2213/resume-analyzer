interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  className?: string
}

function getColor(value: number): string {
  if (value >= 85) return '#4A7C59'
  if (value >= 70) return '#171717'
  if (value >= 55) return '#92743A'
  return '#9B3A3A'
}

export function ProgressBar({ value, max = 100, label, showValue = true, className = '' }: ProgressBarProps) {
  const pct = Math.round((value / max) * 100)
  const color = getColor(value)

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-[#737373]">{label}</span>}
          {showValue && (
            <span
              className="text-xs font-mono font-medium"
              style={{ color }}
            >
              {value}
            </span>
          )}
        </div>
      )}
      <div className="h-[3px] bg-[#E5E5E5] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
