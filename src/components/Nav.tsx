type Screen = 'dashboard' | 'upload' | 'analysis'

interface NavProps {
  screen: Screen
  onNavigate: (screen: Screen) => void
}

export function Nav({ screen, onNavigate }: NavProps) {
  return (
    <header className="h-[52px] bg-[#FFFFFF] border-b border-[#E5E5E5] flex items-center px-6 sticky top-0 z-50">
      <div className="flex items-center justify-between w-full max-w-[1280px] mx-auto">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-[#171717] hover:opacity-70 transition-opacity duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="#171717" />
            <rect x="9" y="1" width="6" height="6" rx="1" fill="#171717" opacity="0.4" />
            <rect x="1" y="9" width="6" height="6" rx="1" fill="#171717" opacity="0.4" />
            <rect x="9" y="9" width="6" height="6" rx="1" fill="#171717" opacity="0.2" />
          </svg>
          <span className="text-[13px] font-medium tracking-tight">Resume Analyzer</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink active={screen === 'dashboard'} onClick={() => onNavigate('dashboard')}>
            Dashboard
          </NavLink>
          <NavLink active={false} onClick={() => onNavigate('upload')}>
            New Analysis
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#171717] flex items-center justify-center">
            <span className="text-[10px] font-medium text-[#FAFAF9]">SC</span>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-[6px] text-[13px] transition-colors duration-150',
        active
          ? 'text-[#171717] bg-[#F5F5F4] font-medium'
          : 'text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F4]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
