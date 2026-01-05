import { useAuthStore } from '../stores/authStore'

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
  })

  if (response.status === 401) {
    // Don't redirect if we're on the login page
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

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}

export { ApiError }
