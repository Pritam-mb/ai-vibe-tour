import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

function Login() {
  const navigate = useNavigate()
  const { login, signup } = useAuthStore()
  const [isSignup, setIsSignup] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        await signup(formData.email, formData.password, formData.name)
      } else {
        await login(formData.email, formData.password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--primary)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: 'var(--secondary)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="flex justify-center mb-4"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-subtle)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <Plane className="h-8 w-8" style={{ color: 'var(--primary)' }} />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-bold mb-1 gradient-text"
          >
            VIBE TRIP
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{ color: 'var(--text-muted)' }}
          >
            AI-Powered Travel Planning
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-xl font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="p-3 rounded-lg mb-4 text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg text-sm"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg text-sm"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                required
                minLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {loading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Log In')}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm"
              style={{ color: 'var(--primary)' }}
            >
              {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login
