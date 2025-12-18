import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

function BudgetTracker({ trip }) {
  const calculateSpent = () => {
    if (!trip.itinerary) return 0
    return trip.itinerary.reduce((total, day) => {
      return total + (day.activities?.reduce((dayTotal, activity) => {
        return dayTotal + (activity.cost || 0)
      }, 0) || 0)
    }, 0)
  }

  const spent = calculateSpent()
  const remaining = trip.budget - spent
  const percentageUsed = ((spent / trip.budget) * 100).toFixed(1)

  return (
    <div className="space-y-5 p-1">
      {/* Overview Card */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #334155' }}>
        <h3 className="text-lg font-bold mb-5" style={{ color: '#F8FAFC' }}>Budget Overview</h3>
        
        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: '#94A3B8' }}>Budget Used</span>
            <span className="font-semibold" style={{ color: '#F8FAFC' }}>{percentageUsed}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'rgba(51, 65, 85, 0.5)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ 
                width: `${Math.min(percentageUsed, 100)}%`,
                background: percentageUsed > 90 
                  ? '#EF4444' 
                  : percentageUsed > 70 
                  ? '#F59E0B' 
                  : '#10B981'
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
            <DollarSign className="h-5 w-5 mx-auto mb-2" style={{ color: '#00D4FF' }} />
            <p className="text-xl font-bold" style={{ color: '#F8FAFC' }}>${trip.budget}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Total</p>
          </div>
          
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <TrendingUp className="h-5 w-5 mx-auto mb-2" style={{ color: '#EF4444' }} />
            <p className="text-xl font-bold" style={{ color: '#EF4444' }}>${spent}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Spent</p>
          </div>
          
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <TrendingDown className="h-5 w-5 mx-auto mb-2" style={{ color: '#10B981' }} />
            <p className="text-xl font-bold" style={{ color: '#10B981' }}>${remaining}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Left</p>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #334155' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#F8FAFC' }}>Daily Breakdown</h3>
        <div className="space-y-2">
          {trip.itinerary?.map((day, idx) => {
            const dayCost = day.activities?.reduce((sum, activity) => sum + (activity.cost || 0), 0) || 0
            return (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                <div>
                  <p className="font-medium text-sm" style={{ color: '#F8FAFC' }}>Day {day.day}</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>{day.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color: '#00D4FF' }}>${dayCost}</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>{day.activities?.length || 0} activities</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Suggestions */}
      {percentageUsed > 80 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <h4 className="font-semibold mb-2" style={{ color: '#F59E0B' }}>⚠️ Budget Alert</h4>
          <p className="text-sm" style={{ color: '#FCD34D' }}>
            You're using {percentageUsed}% of your budget. Consider these money-saving tips:
          </p>
          <ul className="list-disc list-inside text-sm mt-2 space-y-1" style={{ color: '#FCD34D' }}>
            <li>Look for free attractions and walking tours</li>
            <li>Try local street food instead of restaurants</li>
            <li>Use public transportation</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default BudgetTracker
