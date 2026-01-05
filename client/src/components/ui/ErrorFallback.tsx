import { type ReactNode } from 'react'
import Button from './Button'

export interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary?: () => void
  title?: string
  children?: ReactNode
}

export default function ErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',
  children,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">⚠️</div>
        <h2 className="mb-2 text-xl font-semibold text-slate-100">{title}</h2>
        <p className="mb-4 text-slate-400">
          {children || 'An unexpected error occurred. Please try again.'}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 rounded-lg bg-slate-800/50 p-4 text-left">
            <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
              Error details
            </summary>
            <pre className="mt-2 overflow-auto text-xs text-red-400">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <div className="flex justify-center gap-3">
          {resetErrorBoundary && (
            <Button variant="primary" onClick={resetErrorBoundary}>
              Try again
            </Button>
          )}
          <Button variant="secondary" onClick={() => (window.location.href = '/boards')}>
            Go to boards
          </Button>
        </div>
      </div>
    </div>
  )
}
