import { useEffect, useState } from 'react'

/**
 * Tracks the user's OS-level reduced-motion preference, including live changes
 * (e.g. a judge toggling it mid-demo). Tailwind's `motion-safe:` variant handles
 * this automatically for pure CSS-class transitions, but any animation driven
 * from JavaScript (measured height, sliding indicators, count-ups) needs to
 * check this explicitly and skip straight to the end state.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return reduced
}
