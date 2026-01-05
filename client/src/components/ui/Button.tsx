import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'text'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      children,
      disabled,
      isLoading,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary:
        'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white',
      secondary:
        'bg-slate-700 hover:bg-slate-600 text-white',
      danger:
        'text-red-400 hover:text-red-300 hover:bg-red-500/10',
      ghost:
        'text-slate-300 hover:text-white hover:bg-slate-700/50',
      text:
        'text-primary-400 hover:text-primary-300 hover:bg-primary-500/10',
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5',
      lg: 'px-6 py-3',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? 'Loading...' : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
