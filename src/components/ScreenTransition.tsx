import { useEffect, useRef, useState } from 'react'

interface ScreenTransitionProps {
  screenKey: string
  children: React.ReactNode
}

export function ScreenTransition({ screenKey, children }: ScreenTransitionProps) {
  // true = immediately visible on first paint; transitions only fire on navigation
  const [visible, setVisible] = useState(true)
  // Initialize to current key so first render is instant — no entrance animation on load
  const prevKey = useRef<string>(screenKey)

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (prefersReduced) {
      setVisible(true)
      prevKey.current = screenKey
      return
    }

    if (prevKey.current !== screenKey) {
      setVisible(false)
      const t = setTimeout(() => {
        setVisible(true)
        prevKey.current = screenKey
      }, 30)
      return () => clearTimeout(t)
    }
    setVisible(true)
    prevKey.current = screenKey
  }, [screenKey, prefersReduced])

  if (prefersReduced) {
    return <>{children}</>
  }

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: visible
          ? 'opacity 250ms ease-out, transform 250ms ease-out'
          : 'none',
      }}
    >
      {children}
    </div>
  )
}
