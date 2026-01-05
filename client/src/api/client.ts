import { useAuthStore } from '../stores/authStore'
import type { User } from '../types'

const API_BASE = '/api'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

interface AuthResponse {
  token: string
  user: User
}

async function refreshAccessToken(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return false
      }

      const data: AuthResponse = await response.json()
      useAuthStore.getState().setAuth(data.token, data.user)
      return true
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = useAuthStore.getState().token

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for refresh token
  })

  if (response.status === 401) {
    // Don't retry refresh endpoint or if we already retried
    if (endpoint === '/auth/refresh' || isRetry) {
      // Don't redirect if we're on the login page
      if (!window.location.pathname.includes('/login')) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED')
    }

    // Try to refresh the token
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // Retry the original request with the new token
      return request<T>(endpoint, options, true)
    }

    // Refresh failed, logout
    if (!window.location.pathname.includes('/login')) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }))
    const errorInfo = errorData.error || errorData
    throw new ApiError(response.status, errorInfo.message || 'Request failed', errorInfo.code)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

// Attempt to restore session from refresh token cookie
export async function restoreSession(): Promise<boolean> {
  return refreshAccessToken()
}

// Logout and clear refresh token cookie
export async function logoutWithServer(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Ignore errors, just clear local state
  }
  useAuthStore.getState().logout()
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}

export { ApiError }
