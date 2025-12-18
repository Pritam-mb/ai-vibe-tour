import { useState } from 'react'
import { X, Mail, UserPlus, Loader2 } from 'lucide-react'
import { invitationService } from '../services/invitationService'
import { useAuthStore } from '../store/authStore'

function InviteMemberModal({ trip, isOpen, onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate user
    if (!user || !user.email) {
      setError('You must be logged in to send invitations')
      return
    }

    // Validate trip
    if (!trip || !trip.id) {
      setError('Invalid trip information')
      return
    }

    // Check if already a member
    if (trip.members?.some(m => {
      const memberEmail = typeof m === 'string' ? m : m.email
      return memberEmail === email
    })) {
      setError('This person is already a member of the trip')
      return
    }

    setLoading(true)
    try {
      console.log('Sending invitation:', { tripId: trip.id, inviterEmail: user.email, inviteeEmail: email, tripName: trip.name })
      await invitationService.sendInvitation(trip.id, user.email, email, trip.name)
      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (err) {
      console.error('Invitation error:', err)
      setError(err.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 rounded-xl p-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-subtle)' }}>
              <UserPlus className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Invite Member</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>to {trip.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                required
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InviteMemberModal
