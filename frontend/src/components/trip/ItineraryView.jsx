import { useState, useEffect } from 'react'
import { Clock, MapPin, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { tripService } from '../../services/tripService'

function ItineraryView({ trip }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const hasItinerary = trip.itinerary && trip.itinerary.length > 0

  useEffect(() => {
    if (hasItinerary) {
      setIsGenerating(false)
    }
  }, [hasItinerary])

  const handleRegenerate = async () => {
    setIsGenerating(true)
    try {
      await tripService.generateItinerary(trip.id)
    } catch (error) {
      console.error('Failed to generate itinerary:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getActivityIcon = (title) => {
    const lower = title?.toLowerCase() || ''
    if (lower.includes('breakfast')) return '🍳'
    if (lower.includes('lunch')) return '🍽️'
    if (lower.includes('dinner')) return '🍴'
    if (lower.includes('hotel') || lower.includes('check')) return '🏨'
    if (lower.includes('transport') || lower.includes('drive')) return '🚗'
    if (lower.includes('museum') || lower.includes('temple')) return '🏛️'
    if (lower.includes('shop')) return '🛍️'
    if (lower.includes('beach')) return '🏖️'
    if (lower.includes('hike') || lower.includes('trek')) return '🥾'
    if (lower.includes('photo')) return '📸'
    return '📍'
  }

  if (!trip.itinerary || trip.itinerary.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-subtle)' }}>
          {isGenerating ? (
            <RefreshCw className="h-6 w-6 animate-spin" style={{ color: 'var(--primary)' }} />
          ) : (
            <span className="text-2xl">✈️</span>
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {isGenerating ? 'Generating Itinerary...' : 'No Itinerary Yet'}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          {isGenerating
            ? 'AI is crafting your personalized travel plan...'
            : 'Generate a personalized itinerary for your trip.'}
        </p>
        {!isGenerating && (
          <button
            onClick={handleRegenerate}
            className="btn-primary text-sm"
          >
            Generate Itinerary
          </button>
        )}
        {isGenerating && (
          <div className="flex justify-center gap-1.5 mt-3">
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--secondary)', animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {trip.itinerary.map((day, dayIndex) => (
        <motion.div
          key={dayIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dayIndex * 0.08 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          {/* Day Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Day {day.day}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{day.date}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Activities</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>{day.activities?.length || 0}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {day.activities?.map((activity, actIndex) => {
              const isLast = actIndex === day.activities.length - 1

              return (
                <div key={actIndex} className="relative pb-5 last:pb-0">
                  {!isLast && (
                    <div className="absolute left-[50px] top-12 w-px h-full" style={{ background: 'var(--border-color)' }} />
                  )}

                  <div className="flex items-start gap-3">
                    {/* Time */}
                    <div className="flex-shrink-0 w-16">
                      <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'var(--primary-subtle)' }}>
                        <p className="text-xs font-mono font-medium" style={{ color: 'var(--primary)' }}>{activity.time}</p>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0 z-10">
                      <div className="rounded-lg w-9 h-9 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                        <span className="text-sm">{getActivityIcon(activity.title)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 rounded-lg p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{activity.title}</h4>
                        {activity.cost && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)' }}>
                            ${activity.cost}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{activity.description}</p>

                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {activity.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                            <span>{activity.duration}</span>
                          </div>
                        )}
                        {activity.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                            <span>{activity.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {activity.notes && (
                        <p className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>💡 {activity.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recommended Guides */}
          {day.recommendedGuides && day.recommendedGuides.length > 0 && (
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🗺️</span>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recommended Local Guides</h4>
              </div>
              <div className="grid gap-2">
                {day.recommendedGuides.slice(0, 2).map((guide, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{guide.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#d97706' }}>
                        ⭐ {guide.rating}
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{guide.specialty}</p>
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>💬 {guide.languages?.join(', ')}</span>
                      <span className="font-semibold" style={{ color: '#d97706' }}>${guide.pricePerDay}/day</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hotel Information */}
          {day.hotel && (
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏨</span>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Accommodation</h4>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{day.hotel.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#9333ea' }}>
                    ⭐ {day.hotel.rating}
                  </span>
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{day.hotel.address}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {day.hotel.amenities?.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea' }}>
                      {amenity}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Check-in: {day.hotel.checkIn}</span>
                  <span className="font-semibold" style={{ color: '#9333ea' }}>${day.hotel.pricePerNight}/night</span>
                </div>
              </div>
            </div>
          )}

          {/* Day Summary */}
          <div className="mt-5 pt-4 grid grid-cols-3 gap-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="text-center p-2.5 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Cost</p>
              <p className="text-base font-semibold" style={{ color: 'var(--success)' }}>
                ${day.activities?.reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0).toFixed(0)}
              </p>
            </div>
            <div className="text-center p-2.5 rounded-lg" style={{ background: 'var(--primary-subtle)' }}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Activities</p>
              <p className="text-base font-semibold" style={{ color: 'var(--primary)' }}>{day.activities?.length || 0}</p>
            </div>
            <div className="text-center p-2.5 rounded-lg" style={{ background: 'var(--secondary-subtle)' }}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Starts</p>
              <p className="text-base font-semibold" style={{ color: 'var(--secondary)' }}>{day.activities?.[0]?.time || '—'}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default ItineraryView
