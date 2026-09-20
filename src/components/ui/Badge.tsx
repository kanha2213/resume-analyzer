interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral'
  className?: string
}

const variants = {
  default: 'bg-[#F5F5F4] text-[#737373]',
  success: 'bg-[#F0F7F3] text-[#4A7C59]',
  warning: 'bg-[#FBF6EE] text-[#92743A]',
  error: 'bg-[#FBF0F0] text-[#9B3A3A]',
  neutral: 'bg-[#F5F5F4] text-[#171717]',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium',
        variants[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
