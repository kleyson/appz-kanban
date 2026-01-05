import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { restoreSession } from './api/client'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import BoardsPage from './components/board/BoardsPage'
import BoardView from './components/board/BoardView'
import Layout from './components/layout/Layout'
import { SettingsPage } from './components/settings/SettingsPage'
import { ErrorBoundary } from './components/ui'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)

  if (token) {
    return <Navigate to="/boards" replace />
  }

  return <>{children}</>
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const initializeAuth = async () => {
      // Only try to restore session if we don't have a token
      // (persisted token in localStorage might be expired)
      if (!token) {
        await restoreSession()
      }
      setIsInitializing(false)
    }

    initializeAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isInitializing) {
    return <LoadingScreen />
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/boards" replace />} />
          <Route path="boards" element={<BoardsPage />} />
          <Route path="boards/:boardId" element={<BoardView />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
