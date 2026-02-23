import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useAccessibility } from '../../context/AccessibilityContext'

const navItems = [
  { path: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { path: 'analysis', icon: '🎙️', label: 'Speech Analysis' },
  { path: 'coaching', icon: '🧠', label: 'Live Coaching' },
  { path: 'roleplay', icon: '🎭', label: 'Roleplay Mode' },
  { path: 'therapy', icon: '💊', label: 'Therapy Plan' },
  { path: 'progress', icon: '📈', label: 'My Progress' },
  { path: 'community', icon: '🤝', label: 'Community' },
  { path: 'reports', icon: '📄', label: 'Reports' },
  { path: 'profile', icon: '👤', label: 'Profile' }
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuth()
  const { settings, toggle } = useAccessibility()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col border-r overflow-hidden"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          boxShadow: '4px 0 20px rgba(139, 92, 246, 0.06)'
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            F
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-display font-semibold text-lg gradient-text whitespace-nowrap"
              >
                FluentAI
              </motion.span>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(p => !p)}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* User snippet */}
        {sidebarOpen && user && (
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f9a8d4, #8b5cf6)' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🔥 {user.streak || 0} day streak</span>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Level {user.level || 1}</span>
                <span>{user.xp || 0} XP</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${((user.xp || 0) % 200) / 2}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={`/${item.path}`}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t py-3 px-2 space-y-1" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => toggle('darkMode')}
            className="nav-link w-full text-left"
            title={!sidebarOpen ? 'Toggle Theme' : undefined}
          >
            <span className="text-lg">{settings.darkMode ? '☀️' : '🌙'}</span>
            {sidebarOpen && <span>Toggle Theme</span>}
          </button>
          <button
            onClick={handleLogout}
            className="nav-link w-full text-left text-red-500 hover:bg-red-50"
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
