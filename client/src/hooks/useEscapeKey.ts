import { useEffect, useCallback } from 'react'

type EscapeKeyHandler = () => void

/**
 * Hook to handle Escape key press events
 * @param onEscape - Callback function to execute when Escape is pressed
 * @param enabled - Whether the handler is active (default: true)
 */
export function useEscapeKey(onEscape: EscapeKeyHandler, enabled = true) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && enabled) {
        onEscape()
      }
    },
    [onEscape, enabled]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [handleEscape, enabled])
}
