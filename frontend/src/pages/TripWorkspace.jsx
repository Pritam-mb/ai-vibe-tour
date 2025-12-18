import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, Users } from 'lucide-react'
import { tripService } from '../services/tripService'
import ItineraryView from '../components/trip/ItineraryView'
import PendingRequests from '../components/trip/PendingRequests'
import TripChatbot from '../components/trip/TripChatbot'
import InviteMemberModal from '../components/InviteMemberModal'

function TripWorkspace() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('requests')
  const [showInviteModal, setShowInviteModal] = useState(false)

  const handleSuggestionCreated = async (suggestion) => {
    try {
      await tripService.addRequest(tripId, suggestion)
    } catch (error) {
      console.error('Error adding suggestion:', error)
    }
  }

  useEffect(() => {
    const unsubscribe = tripService.subscribeToTrip(tripId, (updatedTrip) => {
      setTrip(updatedTrip)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [tripId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading trip...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Trip not found</p>
          <p style={{ color: 'var(--text-muted)' }}>The trip may have been deleted or you don't have access.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
      <InviteMemberModal 
        trip={trip} 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
      />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside
          className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="p-5">
            {/* Trip Header */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'var(--primary-subtle)', border: '1px solid rgba(14, 165, 233, 0.2)' }}
                >
                  ✈️
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {trip.name}
                  </h2>
                  <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                    {trip.destination}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2.5" style={{ color: 'var(--text-secondary)' }}>
                  <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                  <span>{trip.startDate} – {trip.endDate}</span>
                </div>
                <div className="flex items-center gap-2.5" style={{ color: 'var(--text-secondary)' }}>
                  <Users className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                  <span>{trip.members?.length || 0} travelers</span>
                </div>
              </div>

              {/* Start Journey Button */}
              <button
                onClick={() => window.location.href = `/journey/${tripId}`}
                className="w-full mt-4 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
              >
                <span className="text-base">🚀</span>
                Start Journey
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Plan Your Trip
              </h3>
              <div className="space-y-2">
                <a
                  href={`https://www.google.com/travel/flights?q=flights%20to%20${encodeURIComponent(trip.destination)}%20${trip.startDate}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                >
                  <div className="text-2xl">✈️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Book Flights</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>to {trip.destination}</p>
                  </div>
                </a>
                <a
                  href={`https://www.google.com/travel/hotels/${encodeURIComponent(trip.destination)}/entity`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)' }}
                >
                  <div className="text-2xl">🏨</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Book Hotels</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>in {trip.destination}</p>
                  </div>
                </a>
                <a
                  href="/guides"
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}
                >
                  <div className="text-2xl">🗺️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Find Local Guides</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Browse marketplace</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Team */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Team
              </h3>
              <div className="space-y-2">
                {trip.members?.slice(0, 4).map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2 rounded-lg transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: '#fff' }}
                      >
                        {(member.email?.charAt(0) || 'U').toUpperCase()}
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                        style={{ background: 'var(--success)', borderColor: 'var(--bg-card)' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {member.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                        {member.role || 'Member'}
                      </p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  + Invite
                </button>
              </div>
            </div>

            {/* Budget Card */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--primary-subtle)', border: '1px solid rgba(14, 165, 233, 0.15)' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Budget
              </p>
              <p className="text-3xl font-bold mb-3" style={{ color: 'var(--primary)' }}>
                ${trip.budget?.toLocaleString() || 0}
              </p>
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-elevated)' }}>
                <div className="h-full rounded-full" style={{ width: '35%', background: 'var(--success)' }} />
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>$350 spent</span>
                <span>${(trip.budget || 0) - 350} left</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER: Itinerary */}
        <div className="flex-1 overflow-y-auto p-5" style={{ background: 'var(--bg-base)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Itinerary
            </h2>
          </div>
          <ItineraryView trip={trip} />
        </div>

        {/* RIGHT PANEL */}
        <aside
          className="w-full lg:w-80 flex-shrink-0 flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          {/* Tabs */}
          <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('requests')}
              className="flex-1 px-4 py-3 text-sm font-medium relative transition-colors"
              style={{ color: activeTab === 'requests' ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              Requests
              {trip.pendingRequests?.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--warning)', color: 'var(--bg-base)' }}>
                  {trip.pendingRequests.length}
                </span>
              )}
              {activeTab === 'requests' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--primary)' }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('ai-chat')}
              className="flex-1 px-4 py-3 text-sm font-medium relative transition-colors"
              style={{ color: activeTab === 'ai-chat' ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              AI Chat
              {activeTab === 'ai-chat' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--secondary)' }} />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'requests' && <PendingRequests trip={trip} />}
            {activeTab === 'ai-chat' && <TripChatbot trip={trip} onSuggestionCreated={handleSuggestionCreated} />}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default TripWorkspace
