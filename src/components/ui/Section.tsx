import { useState, useRef, useEffect } from 'react'

interface SectionProps {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}

export function Section({ title, count, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(defaultOpen ? 'auto' : 0)

  useEffect(() => {
    if (!contentRef.current) return
    if (open) {
      const h = contentRef.current.scrollHeight
      setHeight(h)
      const t = setTimeout(() => setHeight('auto'), 210)
      return () => clearTimeout(t)
    } else {
      setHeight(contentRef.current.scrollHeight)
      requestAnimationFrame(() => setHeight(0))
    }
  }, [open])

  return (
    <div className="border-t border-[#E5E5E5]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-[#A3A3A3] font-mono">{count}</span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`text-[#A3A3A3] transition-transform duration-200 group-hover:text-[#737373] ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        ref={contentRef}
        style={{ height: height === 'auto' ? 'auto' : `${height}px`, overflow: 'hidden', transition: 'height 200ms ease' }}
      >
        <div className="pb-4">{children}</div>
      </div>
    </div>
  )
}
