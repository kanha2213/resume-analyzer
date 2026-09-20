import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[#171717] text-[#FAFAF9] hover:bg-[#2a2a2a] active:bg-[#3a3a3a] border border-[#171717]',
  secondary:
    'bg-[#FFFFFF] text-[#171717] hover:bg-[#F5F5F4] active:bg-[#EBEBEA] border border-[#E5E5E5] hover:border-[#D4D4D4]',
  ghost:
    'bg-transparent text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F4] active:bg-[#EBEBEA] border border-transparent',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

function Spinner() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path
        d="M6.5 1.5A5 5 0 0 1 11.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', disabled, loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 font-medium rounded-[6px]',
          'motion-safe:transition-colors motion-safe:duration-150 cursor-pointer',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
