import { useEffect, useState, useRef } from 'react'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }

    startRef.current = null

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      setValue(Math.round(easeOutCubic(progress) * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}
