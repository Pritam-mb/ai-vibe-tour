import { useState, useEffect } from 'react'
import { Users, MapPin, Calendar, Heart } from 'lucide-react'
import { soloTravelerService } from '../services/soloTravelerService'

function SoloTravelers() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const data = await soloTravelerService.findGroups()
      setGroups(data)
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="gradient-hero py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[var(--accent-teal)] rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-[var(--accent-coral)] rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">
            Find Your Travel Buddies
          </h1>
          <p className="text-xl mb-12" style={{ color: 'oklch(0.8 0.01 250)' }}>
            Join existing trips or find solo travelers with similar interests
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto card p-8">
            <h3 className="font-semibold mb-6 text-lg">Search Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Destination (e.g. Tokyo)"
                className="input"
              />
              <input
                type="date"
                placeholder="Travel date"
                className="input"
              />
              <button className="btn-primary">
                Find Matches
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Available Groups */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-4xl font-bold mb-8">Open Travel Groups</h2>
      
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <p className="text-lg" style={{ color: 'oklch(0.7 0.01 250)' }}>Finding amazing travel buddies...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="card hover:shadow-2xl transition-all group cursor-pointer overflow-hidden">
              {/* Card Image Placeholder */}
              <div className="relative -m-6 mb-6 h-48 bg-gradient-to-br from-[var(--accent-teal)] to-[var(--accent-purple)] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-80">
                  🌏
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wide bg-[var(--approved-color)] bg-opacity-90 text-white backdrop-blur-sm">
                    {group.spotsLeft} spots left
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-[var(--accent-teal)] transition-colors">{group.tripName}</h3>
                  <div className="flex items-center text-base mb-1" style={{ color: 'oklch(0.75 0.01 250)' }}>
                    <MapPin className="h-5 w-5 mr-2" />
                    {group.destination}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center" style={{ color: 'oklch(0.75 0.01 250)' }}>
                  <Calendar className="h-5 w-5 mr-3" />
                  <span className="font-mono text-sm">{group.dates}</span>
                </div>
                <div className="flex items-center" style={{ color: 'oklch(0.75 0.01 250)' }}>
                  <Users className="h-5 w-5 mr-3" />
                  {group.currentMembers}/{group.maxMembers} travelers
                </div>
              </div>

              <p className="mb-6 leading-relaxed" style={{ color: 'oklch(0.75 0.01 250)' }}>{group.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {group.interests?.map((interest, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs px-3 py-1.5 rounded-xl font-medium"
                    style={{ 
                      background: 'var(--primary)', 
                      color: 'white',
                      opacity: 0.9
                    }}
                  >
                    {interest}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button className="flex-1 btn-primary">
                  Request to Join
                </button>
                <button className="btn-secondary p-3">
                  <Heart className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {groups.length === 0 && !loading && (
        <div className="card text-center py-20">
          <Users className="h-20 w-20 mx-auto mb-6" style={{ color: 'oklch(0.6 0.01 250)' }} />
          <h3 className="text-2xl font-semibold mb-3">No open groups found</h3>
          <p className="text-lg" style={{ color: 'oklch(0.7 0.01 250)' }}>Try different search criteria!</p>
        </div>
      )}
      </div>
    </div>
  )
}

export default SoloTravelers
