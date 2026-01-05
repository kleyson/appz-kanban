import type { ReactNode } from 'react'

export interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  color?: string
  className?: string
}

const variantStyles = {
  default: 'bg-slate-700/50 text-slate-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  danger: 'bg-red-500/20 text-red-400',
  info: 'bg-primary-500/20 text-primary-400',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  color,
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1 rounded-md font-medium'

  if (color) {
    return (
      <span
        className={`${baseStyles} ${sizeStyles[size]} text-white ${className}`}
        style={{ backgroundColor: color }}
      >
        {children}
      </span>
    )
  }

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  )
}
