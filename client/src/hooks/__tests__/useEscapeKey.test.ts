import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useEscapeKey } from '../useEscapeKey'

describe('useEscapeKey', () => {
  // Track listeners to verify cleanup
  let originalAddEventListener: typeof window.addEventListener
  let originalRemoveEventListener: typeof window.removeEventListener
  let listeners: { type: string; handler: (e: Event) => void }[] = []

  beforeEach(() => {
    listeners = []
    originalAddEventListener = window.addEventListener
    originalRemoveEventListener = window.removeEventListener

    // Wrap to track listeners while still allowing events to work
    window.addEventListener = ((
      type: string,
      handler: (e: Event) => void,
      options?: boolean | object
    ) => {
      listeners.push({ type, handler })
      return originalAddEventListener.call(window, type, handler, options)
    }) as typeof window.addEventListener

    window.removeEventListener = ((
      type: string,
      handler: (e: Event) => void,
      options?: boolean | object
    ) => {
      const idx = listeners.findIndex((l) => l.type === type && l.handler === handler)
      if (idx !== -1) listeners.splice(idx, 1)
      return originalRemoveEventListener.call(window, type, handler, options)
    }) as typeof window.removeEventListener
  })

  afterEach(() => {
    window.addEventListener = originalAddEventListener
    window.removeEventListener = originalRemoveEventListener
  })

  it('should add keydown event listener on mount', () => {
    const onEscape = mock(() => {})
    renderHook(() => useEscapeKey(onEscape))

    const keydownListeners = listeners.filter((l) => l.type === 'keydown')
    expect(keydownListeners.length).toBe(1)
  })

  it('should remove keydown event listener on unmount', () => {
    const onEscape = mock(() => {})
    const { unmount } = renderHook(() => useEscapeKey(onEscape))

    expect(listeners.filter((l) => l.type === 'keydown').length).toBe(1)

    unmount()

    expect(listeners.filter((l) => l.type === 'keydown').length).toBe(0)
  })

  it('should call onEscape when Escape key is pressed', () => {
    const onEscape = mock(() => {})
    renderHook(() => useEscapeKey(onEscape))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('should not call onEscape when other keys are pressed', () => {
    const onEscape = mock(() => {})
    renderHook(() => useEscapeKey(onEscape))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    })

    expect(onEscape).not.toHaveBeenCalled()
  })

  it('should not call onEscape when disabled', () => {
    const onEscape = mock(() => {})
    renderHook(() => useEscapeKey(onEscape, false))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(onEscape).not.toHaveBeenCalled()
  })

  it('should not add event listener when disabled', () => {
    const onEscape = mock(() => {})
    renderHook(() => useEscapeKey(onEscape, false))

    const keydownListeners = listeners.filter((l) => l.type === 'keydown')
    expect(keydownListeners.length).toBe(0)
  })

  it('should re-enable listener when enabled changes to true', () => {
    const onEscape = mock(() => {})
    const { rerender } = renderHook(({ enabled }) => useEscapeKey(onEscape, enabled), {
      initialProps: { enabled: false },
    })

    // Initially disabled, no keydown listener
    expect(listeners.filter((l) => l.type === 'keydown').length).toBe(0)

    // Enable the hook
    rerender({ enabled: true })

    // Now keydown listener should be added
    expect(listeners.filter((l) => l.type === 'keydown').length).toBe(1)

    // Should work now
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('should update callback when it changes', () => {
    const onEscape1 = mock(() => {})
    const onEscape2 = mock(() => {})

    const { rerender } = renderHook(({ callback }) => useEscapeKey(callback), {
      initialProps: { callback: onEscape1 },
    })

    // Change callback
    rerender({ callback: onEscape2 })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(onEscape1).not.toHaveBeenCalled()
    expect(onEscape2).toHaveBeenCalledTimes(1)
  })
})
