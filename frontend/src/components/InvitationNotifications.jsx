import { useState, useEffect } from 'react'
import { Bell, Check, X, Loader2 } from 'lucide-react'
import { invitationService } from '../services/invitationService'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

function InvitationNotifications() {
  const [invitations, setInvitations] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState({})
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.email) return
    const unsubscribe = invitationService.subscribeToInvitations(user.email, (invites) => {
      setInvitations(invites)
    })
    return () => unsubscribe()
  }, [user?.email])

  const handleAccept = async (invitationId) => {
    setLoading(prev => ({ ...prev, [invitationId]: 'accept' }))
    try {
      const tripId = await invitationService.acceptInvitation(invitationId, user.uid)
      // Close the modal and redirect to the trip
      setIsOpen(false)
      setTimeout(() => {
        navigate(`/trip/${tripId}`)
      }, 500)
    } catch (error) {
      console.error('Error accepting invitation:', error)
      alert(error.message || 'Failed to accept invitation')
    } finally {
      setLoading(prev => ({ ...prev, [invitationId]: null }))
    }
  }

  const handleDecline = async (invitationId) => {
    setLoading(prev => ({ ...prev, [invitationId]: 'decline' }))
    try {
      await invitationService.declineInvitation(invitationId)
    } catch (error) {
      console.error('Error declining invitation:', error)
    } finally {
      setLoading(prev => ({ ...prev, [invitationId]: null }))
    }
  }

  const pendingCount = invitations.filter(i => i.status === 'pending').length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Bell className="h-5 w-5" />
        {pendingCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-xs font-bold flex items-center justify-center"
            style={{ background: 'var(--error)', color: '#fff' }}
          >
            {pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
          >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {invitations.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications</p>
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="p-4"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                      <span className="font-medium">{invitation.inviterEmail?.split('@')[0]}</span> invited you to
                    </p>
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--primary)' }}>
                      {invitation.tripName}
                    </p>

                    {invitation.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(invitation.id)}
                          disabled={loading[invitation.id]}
                          className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                          style={{ background: 'var(--success)', color: '#fff' }}
                        >
                          {loading[invitation.id] === 'accept' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(invitation.id)}
                          disabled={loading[invitation.id]}
                          className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                          style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)' }}
                        >
                          {loading[invitation.id] === 'decline' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span
                        className="text-xs px-2 py-1 rounded font-medium"
                        style={{
                          background: invitation.status === 'accepted' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: invitation.status === 'accepted' ? 'var(--success)' : 'var(--error)'
                        }}
                      >
                        {invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default InvitationNotifications
