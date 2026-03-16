import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import FaceAuth from '../components/FaceAuth'

const stammering_levels = ['Mild', 'Moderate', 'Severe', 'Prefer not to say']
const goals = [
  'Job interviews',
  'Public speaking',
  'Social conversations',
  'Phone calls',
  'Class/presentations',
  'General confidence'
]

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    stammering_level: '',
    primary_goals: [],
    anonymous_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [faceDescriptor, setFaceDescriptor] = useState(null)
  const [faceSkipped, setFaceSkipped] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const toggleGoal = (goal) => {
    setForm(p => ({
      ...p,
      primary_goals: p.primary_goals.includes(goal)
        ? p.primary_goals.filter(g => g !== goal)
        : [...p.primary_goals, goal]
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // register() returns the user object directly (not {token, user})
      // token is already saved to localStorage inside AuthContext
      const user = await register(form)

      console.log('Registered user:', user)

      // Save face if captured
      if (faceDescriptor) {
        try {
          const token = localStorage.getItem('token') // token is now in localStorage
          const userId = user?._id || user?.id

          console.log('Saving face — userId:', userId)

          await axios.post('/api/face/register',
            { descriptor: faceDescriptor },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          toast.success('Welcome to FluentAI! Face login enabled 🎉')
        } catch (faceErr) {
          console.error('Face save error:', faceErr.response?.data || faceErr.message)
          toast.success('Welcome to FluentAI! 🎉')
        }
      } else {
        toast.success('Welcome to FluentAI! Your journey begins now 🎉')
      }

      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>F</div>
            <span className="font-display font-semibold text-xl gradient-text">FluentAI</span>
          </Link>

          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map(s => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s <= step ? 'text-white' : 'text-gray-400 bg-gray-100'
                }`} style={s <= step ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' } : {}}>
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && <div className={`w-10 h-0.5 transition-all ${s < step ? 'bg-lavender-500' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          <h1 className="font-display text-2xl font-bold">
            {step === 1 && 'Create your account'}
            {step === 2 && 'Tell us about yourself'}
            {step === 3 && 'Set your goals'}
            {step === 4 && 'Enable Face Login'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {step === 1 && 'Completely free, always'}
            {step === 2 && 'This helps us personalize your experience'}
            {step === 3 && 'What would you like to achieve?'}
            {step === 4 && 'Optional — login instantly with your face next time'}
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input className="input-field" placeholder="Your name" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input type="password" className="input-field" placeholder="Min 8 characters" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Community Name (Anonymous)</label>
              <input className="input-field" placeholder="e.g. SpeakingWarrior" value={form.anonymous_name}
                onChange={e => setForm(p => ({ ...p, anonymous_name: e.target.value }))} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                This is how you'll appear in the community — fully anonymous
              </p>
            </div>
            <button onClick={() => setStep(2)} disabled={!form.name || !form.email || !form.password}
              className="btn-primary w-full py-3.5">Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Your Age</label>
              <input type="number" className="input-field" placeholder="e.g. 24" value={form.age}
                onChange={e => setForm(p => ({ ...p, age: e.target.value }))} min="5" max="99" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">Stammering Level</label>
              <div className="grid grid-cols-2 gap-3">
                {stammering_levels.map(level => (
                  <button key={level} onClick={() => setForm(p => ({ ...p, stammering_level: level }))}
                    className={`p-3 rounded-xl text-sm border-2 transition-all ${
                      form.stammering_level === level
                        ? 'border-lavender-500 bg-lavender-50 text-lavender-700 font-medium'
                        : 'border-gray-200 hover:border-lavender-300'
                    }`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3">Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-3">
                What situations do you want to improve? (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {goals.map(goal => (
                  <button key={goal} onClick={() => toggleGoal(goal)}
                    className={`p-3 rounded-xl text-sm border-2 transition-all text-left ${
                      form.primary_goals.includes(goal)
                        ? 'border-lavender-500 bg-lavender-50 text-lavender-700 font-medium'
                        : 'border-gray-200 hover:border-lavender-300'
                    }`}>
                    {goal}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">← Back</button>
              <button onClick={() => setStep(4)} disabled={form.primary_goals.length === 0}
                className="btn-primary flex-1 py-3">Continue →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            {faceDescriptor ? (
              <div className="p-4 rounded-xl text-center"
                style={{ background: 'rgba(134,239,172,0.1)', border: '2px solid rgba(134,239,172,0.3)' }}>
                <div className="text-3xl mb-2">✅</div>
                <p className="font-medium text-green-600">Face registered successfully!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  You can now login with your face next time
                </p>
                <button onClick={() => setFaceDescriptor(null)}
                  className="text-xs mt-2 underline" style={{ color: 'var(--text-muted)' }}>
                  Re-capture
                </button>
              </div>
            ) : (
              <FaceAuth
                mode="register"
                onSuccess={(descriptor) => {
                  setFaceDescriptor(descriptor)
                  setFaceSkipped(false)
                }}
                onError={() => toast.error('Face capture failed. You can skip this step.')}
              />
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1 py-3">← Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 py-3">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : faceDescriptor ? 'Begin Journey 🚀' : 'Skip & Begin Journey 🚀'}
              </button>
            </div>

            {!faceDescriptor && (
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Face login is optional. You can always enable it later from your profile.
              </p>
            )}
          </div>
        )}

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium" style={{ color: 'var(--primary)' }}>Sign in →</Link>
        </p>
      </motion.div>
    </div>
  )
}