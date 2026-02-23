import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AccessibilityProvider } from './context/AccessibilityContext'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AnalysisPage from './pages/AnalysisPage'
import CoachingPage from './pages/CoachingPage'
import RoleplayPage from './pages/RoleplayPage'
import TherapyPage from './pages/TherapyPage'
import CommunityPage from './pages/CommunityPage'
import ReportsPage from './pages/ReportsPage'
import ProfilePage from './pages/ProfilePage'
import ProgressPage from './pages/ProgressPage'

// Layout
import AppLayout from './components/dashboard/AppLayout'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

const LoadingScreen = () => (
  <div className="min-h-screen gradient-bg flex items-center justify-center">
    <div className="text-center">
      <div className="flex gap-1 justify-center mb-4">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="gradient-text font-display text-xl font-semibold">FluentAI</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Loading your safe space...</p>
    </div>
  </div>
)

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="coaching" element={<CoachingPage />} />
        <Route path="roleplay" element={<RoleplayPage />} />
        <Route path="therapy" element={<TherapyPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.12)'
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#fff' }
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' }
              }
            }}
          />
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
