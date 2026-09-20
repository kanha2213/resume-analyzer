import { Nav } from './Nav'

type Screen = 'dashboard' | 'upload' | 'analysis'

interface ShellProps {
  screen: Screen
  onNavigate: (screen: Screen) => void
  children: React.ReactNode
}

export function Shell({ screen, onNavigate, children }: ShellProps) {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Nav screen={screen} onNavigate={onNavigate} />
      <main className="w-full max-w-[1280px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
