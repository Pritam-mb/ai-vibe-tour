import { Users, Calendar, DollarSign, MapPin, Share2, Settings } from 'lucide-react'

function TripHeader({ trip }) {
  return (
    <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #334155', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#F8FAFC' }}>{trip.name}</h1>
          <div className="flex items-center" style={{ color: '#94A3B8' }}>
            <MapPin className="h-4 w-4 mr-2" style={{ color: '#00D4FF' }} />
            <span className="text-base">{trip.destination}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 rounded-xl transition-all" style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
            <Share2 className="h-5 w-5" style={{ color: '#00D4FF' }} />
          </button>
          <button className="p-2.5 rounded-xl transition-all" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <Settings className="h-5 w-5" style={{ color: '#8B5CF6' }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.15)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0, 212, 255, 0.2)' }}>
            <Calendar className="h-5 w-5" style={{ color: '#00D4FF' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Duration</p>
            <p className="font-semibold text-sm" style={{ color: '#F8FAFC' }}>{trip.startDate} - {trip.endDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
            <DollarSign className="h-5 w-5" style={{ color: '#10B981' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Budget</p>
            <p className="font-semibold text-sm" style={{ color: '#F8FAFC' }}>${trip.budget}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
            <Users className="h-5 w-5" style={{ color: '#8B5CF6' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Members</p>
            <p className="font-semibold text-sm" style={{ color: '#F8FAFC' }}>{trip.members?.length || 0} travelers</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripHeader
