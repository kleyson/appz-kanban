import type { ReactNode } from 'react'

export interface ModalProps {
  children: ReactNode
  onClose?: () => void
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  className?: string
}

const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
}

export default function Modal({ children, onClose, maxWidth = '3xl', className = '' }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full ${maxWidthStyles[maxWidth]} shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export interface ModalHeaderProps {
  children: ReactNode
  onClose?: () => void
  actions?: ReactNode
}

export function ModalHeader({ children, onClose, actions }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between p-6 border-b border-slate-700/50">
      <div className="flex-1 mr-4">{children}</div>
      <div className="flex items-center gap-2">
        {actions}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export interface ModalBodyProps {
  children: ReactNode
  className?: string
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

export interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div
      className={`flex items-center justify-between p-6 border-t border-slate-700/50 ${className}`}
    >
      {children}
    </div>
  )
}
