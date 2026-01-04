import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterEach } from 'bun:test'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Setup happy-dom for DOM environment
GlobalRegistrator.register()

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock window.matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock document.fullscreenElement
Object.defineProperty(document, 'fullscreenElement', {
  value: null,
  writable: true,
  configurable: true,
})

// Mock document.documentElement.requestFullscreen
document.documentElement.requestFullscreen = async () => {}
document.exitFullscreen = async () => {}

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.OPEN
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((error: Error) => void) | null = null

  send = () => {}
  close = () => {
    this.readyState = MockWebSocket.CLOSED
  }
}

Object.defineProperty(globalThis, 'WebSocket', {
  value: MockWebSocket,
  writable: true,
})
