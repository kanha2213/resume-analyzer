import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Returns false, then true after `ms` milliseconds — used to delay revealing
 * an element (like a status badge) until a paired count-up animation has
 * genuinely finished, so it doesn't appear before the number it describes.
 * Resolves instantly when the user prefers reduced motion.
 */
export function useRevealAfter(ms: number): boolean {
  const prefersReduced = usePrefersReducedMotion()
  const [revealed, setRevealed] = useState(prefersReduced)

  useEffect(() => {
    if (prefersReduced) {
      setRevealed(true)
      return
    }
    setRevealed(false)
    const t = setTimeout(() => setRevealed(true), ms)
    return () => clearTimeout(t)
  }, [ms, prefersReduced])

  return revealed
}
