export interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
}

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initial = name?.charAt(0).toUpperCase() || '?'

  return (
    <div
      className={`bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium ${sizeStyles[size]} ${className}`}
      title={name}
    >
      {initial}
    </div>
  )
}
