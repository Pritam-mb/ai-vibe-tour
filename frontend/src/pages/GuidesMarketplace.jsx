import { useState, useEffect } from 'react'
import { MapPin, DollarSign, Users, Star } from 'lucide-react'
import { guideService } from '../services/guideService'

function GuidesMarketplace() {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    region: '',
    maxPrice: '',
    availability: false
  })

  useEffect(() => {
    loadGuides()
  }, [filters])

  const loadGuides = async () => {
    try {
      const data = await guideService.getGuides(filters)
      setGuides(data)
    } catch (error) {
      console.error('Error loading guides:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="gradient-hero py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-64 h-64 bg-[var(--accent-gold)] rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-[var(--accent-teal)] rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">
            Local Guides Marketplace
          </h1>
          <p className="text-xl mb-6" style={{ color: 'oklch(0.8 0.01 250)' }}>
            Find experienced local guides for your destination
          </p>
          <a 
            href="/register-guide" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold mb-8 transition-all hover:scale-105"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            ✨ Become a Tour Guide
          </a>

          {/* Filters */}
          <div className="max-w-4xl mx-auto card p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search region..."
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="input"
              />
              <input
                type="number"
                placeholder="Max price per day"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="input"
              />
              <label className="flex items-center space-x-3 px-5 py-3 rounded-xl cursor-pointer" style={{ background: 'oklch(0.16 0.018 250)', border: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  checked={filters.availability}
                  onChange={(e) => setFilters({ ...filters, availability: e.target.checked })}
                  className="rounded"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Available only</span>
              </label>
              <button onClick={loadGuides} className="btn-primary">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Guides Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <p className="text-lg" style={{ color: 'oklch(0.7 0.01 250)' }}>Finding the best local guides...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <div key={guide.id} className="card hover:shadow-2xl transition-all group cursor-pointer overflow-hidden">
              {/* Guide Avatar Section */}
              <div className="relative -m-6 mb-6 h-56 bg-gradient-to-br from-[var(--accent-gold)] via-[var(--accent-coral)] to-[var(--accent-purple)] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-6xl border-4 border-white/30">
                    👨‍🦰
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm">
                  <Star className="h-5 w-5 fill-[var(--accent-gold)] text-[var(--accent-gold)]" />
                  <span className="font-bold text-gray-900">{guide.rating}</span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-[var(--accent-gold)] transition-colors">{guide.name}</h3>
                <div className="flex items-center text-base" style={{ color: 'oklch(0.75 0.01 250)' }}>
                  <MapPin className="h-5 w-5 mr-2" />
                  {guide.region}
                </div>
              </div>

              <p className="mb-6 leading-relaxed" style={{ color: 'oklch(0.75 0.01 250)' }}>{guide.description}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'oklch(0.7 0.01 250)' }}>Price per day:</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--accent-gold)' }}>${guide.pricePerDay}</span>
                </div>
                {guide.experience && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'oklch(0.7 0.01 250)' }}>Experience:</span>
                    <span className="font-semibold">{guide.experience} years</span>
                  </div>
                )}
                {guide.languages && guide.languages.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'oklch(0.7 0.01 250)' }}>Languages:</span>
                    <span className="font-semibold text-sm">{guide.languages.slice(0, 2).join(', ')}</span>
                  </div>
                )}
                {guide.verified && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'oklch(0.7 0.01 250)' }}>Status:</span>
                    <span className="font-semibold text-green-500">✓ Verified</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {guide.specialties?.map((specialty, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs px-3 py-1.5 rounded-xl font-medium"
                    style={{ 
                      background: 'var(--accent-gold)', 
                      color: 'white',
                      opacity: 0.9
                    }}
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              <button className="w-full btn-primary">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {guides.length === 0 && !loading && (
        <div className="card text-center py-20">
          <Users className="h-20 w-20 mx-auto mb-6" style={{ color: 'oklch(0.6 0.01 250)' }} />
          <h3 className="text-2xl font-semibold mb-3">No guides found</h3>
          <p className="text-lg" style={{ color: 'oklch(0.7 0.01 250)' }}>Try different search criteria!</p>
        </div>
      )}
      </div>
    </div>
  )
}

export default GuidesMarketplace
