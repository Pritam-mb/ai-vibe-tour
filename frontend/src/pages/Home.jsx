import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, DollarSign, MapPin, Sparkles, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { tripService } from '../services/tripService'
import { useAuthStore } from '../store/authStore'

function Home() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) loadTrips()
  }, [user])

  const loadTrips = async () => {
    try {
      if (user?.uid) {
        const userTrips = await tripService.getUserTrips(user.uid)
        setTrips(userTrips)
      }
    } catch (error) {
      console.error('Error loading trips:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Hero */}
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden gradient-hero">
        {/* Glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--primary)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: 'var(--secondary)' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'var(--secondary-subtle)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <Sparkles className="h-4 w-4" style={{ color: 'var(--secondary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--secondary)' }}>AI-Powered Trip Planning</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-5 leading-tight" style={{ color: 'var(--text-primary)' }}>
              Plan trips<br />
              <span className="gradient-text">together, smarter</span>
            </h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Create trips, invite friends, and let AI craft the perfect itinerary. Real-time collaboration meets intelligent planning.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link to="/create-trip" className="btn-primary text-base px-8 py-3 flex items-center justify-center gap-2">
                Start Planning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/guides" className="btn-secondary text-base px-8 py-3">
                Browse Guides
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Trips Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Trips</h2>
          <Link to="/create-trip" className="btn-primary text-sm py-2 px-4">
            + New Trip
          </Link>
        </div>

        {trips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-16"
          >
            <MapPin className="h-16 w-16 mx-auto mb-5" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No trips yet</h3>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Start planning your next adventure!</p>
            <Link to="/create-trip" className="btn-primary">
              Create Your First Trip
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Link to={`/trip/${trip.id}`} className="card block group">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {trip.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{trip.destination}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <Calendar className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                      <span className="font-mono text-xs">{trip.startDate} – {trip.endDate}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <Users className="h-4 w-4" style={{ color: 'var(--secondary)' }} />
                      <span>{trip.members?.length || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <DollarSign className="h-4 w-4" style={{ color: 'var(--success)' }} />
                      <span>${trip.budget?.toLocaleString() || 0}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <span
                      className="text-xs px-2.5 py-1 rounded font-medium uppercase tracking-wide"
                      style={{
                        background: trip.status === 'planning'
                          ? 'rgba(234, 179, 8, 0.15)'
                          : trip.status === 'active'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'var(--bg-elevated)',
                        color: trip.status === 'planning'
                          ? 'var(--warning)'
                          : trip.status === 'active'
                          ? 'var(--success)'
                          : 'var(--text-muted)'
                      }}
                    >
                      {trip.status}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Users, color: 'var(--primary)', title: 'Collaborate', desc: 'Plan together with your travel group in real-time' },
            { icon: Sparkles, color: 'var(--secondary)', title: 'AI-Powered', desc: 'Get smart suggestions and optimized itineraries' },
            { icon: Calendar, color: 'var(--warning)', title: 'Live Updates', desc: 'Real-time adjustments during your journey' }
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card text-center"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-elevated)' }}>
                <feature.icon className="h-7 w-7" style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
