import { forwardRef, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'transparent'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const baseStyles =
      'w-full text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-colors'

    const variantStyles = {
      default: 'px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl',
      transparent: 'bg-transparent border-none focus:ring-0',
    }

    return (
      <input
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
