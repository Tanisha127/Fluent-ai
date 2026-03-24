import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import FaceAuth from '../components/FaceAuth'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showFaceLogin, setShowFaceLogin] = useState(false)
  const [faceLoading, setFaceLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFaceSuccess = async (descriptor, email) => {
    setFaceLoading(true)
    try {
      const res = await axios.post('/api/face/login', { descriptor, email })
      localStorage.setItem('token', res.data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      toast.success('Face recognised! Welcome back 👤')
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err.response?.data?.message || 'Face not recognised. Use password instead.')
      setShowFaceLogin(false)
    } finally {
      setFaceLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>F</div>
            <span className="font-display font-semibold text-xl gradient-text">FluentAI</span>
          </Link>
          <h1 className="font-display text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Continue your confidence journey
          </p>
        </div>

        {/* Toggle buttons */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)' }}>
          <button
            onClick={() => setShowFaceLogin(false)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={!showFaceLogin ? {
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: '#fff'
            } : { color: 'var(--text-muted)' }}
          >
            🔑 Password
          </button>
          <button
            onClick={() => setShowFaceLogin(true)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={showFaceLogin ? {
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: '#fff'
            } : { color: 'var(--text-muted)' }}
          >
            👤 Face Login
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showFaceLogin ? (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>

              <div className="mt-4 p-4 rounded-xl text-sm text-center"
                style={{ background: 'rgba(139, 92, 246, 0.06)' }}>
                <p style={{ color: 'var(--text-muted)' }}>
                  Demo: <strong>demo@fluent.ai</strong> / <strong>demo1234</strong>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="face"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="mb-4 p-3 rounded-xl text-sm text-center"
                style={{ background: 'rgba(139,92,246,0.06)', color: 'var(--text-muted)' }}>
                You must have registered your face during sign-up to use this.
              </div>

              {faceLoading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Verifying identity...</p>
                </div>
              ) : (
                <FaceAuth
                  mode="login"
                  onSuccess={handleFaceSuccess}
                  onError={(err) => {
                    toast.error('Face scan failed. Try again.')
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          New here?{' '}
          <Link to="/register" className="font-medium" style={{ color: 'var(--primary)' }}>
            Create your account →
          </Link>
        </p>
      </motion.div>
    </div>
  )
}