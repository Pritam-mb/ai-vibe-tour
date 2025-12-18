import { useState, useEffect } from 'react'
import { Check, X, Mail, Phone, MapPin, Award, Clock } from 'lucide-react'

function AdminGuides() {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // 'pending', 'verified', 'all'

  useEffect(() => {
    loadGuides()
  }, [filter])

  const loadGuides = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5003/api/guides?all=true')
      const data = await response.json()
      
      let filtered = data
      if (filter === 'pending') {
        filtered = data.filter(g => !g.verified)
      } else if (filter === 'verified') {
        filtered = data.filter(g => g.verified)
      }
      
      setGuides(filtered)
    } catch (error) {
      console.error('Error loading guides:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (guideId) => {
    try {
      const response = await fetch(`http://localhost:5003/api/guides/${guideId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true })
      })

      if (response.ok) {
        loadGuides()
      }
    } catch (error) {
      console.error('Error approving guide:', error)
    }
  }

  const handleReject = async (guideId) => {
    if (!confirm('Are you sure you want to reject this guide application?')) return

    try {
      const response = await fetch(`http://localhost:5003/api/guides/${guideId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadGuides()
      }
    } catch (error) {
      console.error('Error rejecting guide:', error)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--bg-dark)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Guide Management
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Review and approve guide applications</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'pending' ? 'shadow-lg' : ''
            }`}
            style={{
              background: filter === 'pending' ? 'var(--warning)' : 'var(--bg-card)',
              color: filter === 'pending' ? 'var(--bg-base)' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            Pending ({guides.filter(g => !g.verified).length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'verified' ? 'shadow-lg' : ''
            }`}
            style={{
              background: filter === 'verified' ? 'var(--success)' : 'var(--bg-card)',
              color: filter === 'verified' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            Verified ({guides.filter(g => g.verified).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all' ? 'shadow-lg' : ''
            }`}
            style={{
              background: filter === 'all' ? 'var(--primary)' : 'var(--bg-card)',
              color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            All Guides
          </button>
        </div>

        {/* Guides List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" 
                 style={{ borderColor: 'var(--primary)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading guides...</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-20 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>No guides found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="rounded-xl p-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                      style={{ background: 'var(--primary-subtle)' }}
                    >
                      👤
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {guide.name}
                        </h3>
                        {guide.verified && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" 
                                style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}>
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {guide.specialty}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{guide.destination}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{guide.email}</span>
                        </div>
                        {guide.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{guide.phone}</span>
                          </div>
                        )}
                        {guide.experience && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{guide.experience} years exp.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>
                      ${guide.pricePerDay}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>per day</p>
                  </div>
                </div>

                {guide.bio && (
                  <p className="text-sm mb-4 p-3 rounded-lg" 
                     style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                    {guide.bio}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4" 
                     style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex gap-2">
                    {guide.languages?.map((lang, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>

                  {!guide.verified && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(guide.id)}
                        className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all hover:scale-105"
                        style={{ background: 'var(--success)', color: '#fff' }}
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(guide.id)}
                        className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all hover:scale-105"
                        style={{ background: 'rgba(239, 68, 68, 0.9)', color: '#fff' }}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminGuides
