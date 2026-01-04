import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useFullscreen } from '../useFullscreen'

describe('useFullscreen', () => {
  let requestFullscreenMock: ReturnType<typeof mock>
  let exitFullscreenMock: ReturnType<typeof mock>

  beforeEach(() => {
    requestFullscreenMock = mock(() => Promise.resolve())
    exitFullscreenMock = mock(() => Promise.resolve())

    document.documentElement.requestFullscreen = requestFullscreenMock
    document.exitFullscreen = exitFullscreenMock

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    })
  })

  it('should initialize with isFullscreen as false', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(result.current.isFullscreen).toBe(false)
  })

  it('should have enterFullscreen function', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(typeof result.current.enterFullscreen).toBe('function')
  })

  it('should have exitFullscreen function', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(typeof result.current.exitFullscreen).toBe('function')
  })

  it('should have toggleFullscreen function', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(typeof result.current.toggleFullscreen).toBe('function')
  })

  it('should call requestFullscreen when enterFullscreen is called', async () => {
    const { result } = renderHook(() => useFullscreen())

    await act(async () => {
      await result.current.enterFullscreen()
    })

    expect(requestFullscreenMock).toHaveBeenCalled()
  })

  it('should call exitFullscreen when exitFullscreen is called and in fullscreen', async () => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: document.documentElement,
      configurable: true,
    })

    const { result } = renderHook(() => useFullscreen())

    await act(async () => {
      await result.current.exitFullscreen()
    })

    expect(exitFullscreenMock).toHaveBeenCalled()
  })

  it('should toggle fullscreen when toggleFullscreen is called', async () => {
    const { result } = renderHook(() => useFullscreen())

    // Initially not fullscreen, so toggle should enter
    await act(async () => {
      result.current.toggleFullscreen()
    })

    expect(requestFullscreenMock).toHaveBeenCalled()
  })
})
