import { useState } from 'react'
import { Clock, User, ThumbsUp, ThumbsDown, Brain, TrendingUp } from 'lucide-react'
import { tripService } from '../../services/tripService'

function PendingRequests({ trip }) {
  const [analyzingId, setAnalyzingId] = useState(null)
  const [selectedRequests, setSelectedRequests] = useState([])
  const [comparing, setComparing] = useState(false)

  const handleAnalyze = async (requestId) => {
    setAnalyzingId(requestId)
    try {
      await tripService.analyzeRequest(trip.id, requestId)
    } catch (error) {
      console.error('Error analyzing request:', error)
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleAccept = async (requestId) => {
    try {
      await tripService.acceptRequest(trip.id, requestId)
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const handleReject = async (requestId) => {
    try {
      await tripService.rejectRequest(trip.id, requestId)
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  const handleCompare = async () => {
    if (selectedRequests.length < 2) return
    
    setComparing(true)
    try {
      await tripService.compareRequests(trip.id, selectedRequests)
      setSelectedRequests([])
    } catch (error) {
      console.error('Error comparing requests:', error)
    } finally {
      setComparing(false)
    }
  }

  const toggleSelection = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    )
  }

  const pendingRequests = trip.pendingRequests || []
  const analyzedRequests = pendingRequests.filter(r => r.aiAnalysis)

  return (
    <div className="h-full flex flex-col">
      {/* Compare Bar */}
      {analyzedRequests.length >= 2 && (
        <div className="p-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Compare Requests
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selectedRequests.length === 0 
                  ? 'Select 2+ to compare with Places API' 
                  : `${selectedRequests.length} selected`}
              </p>
            </div>
            <button
              onClick={handleCompare}
              disabled={selectedRequests.length < 2 || comparing}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ 
                background: selectedRequests.length >= 2 ? 'linear-gradient(135deg, var(--secondary), var(--primary))' : 'var(--bg-subtle)',
                color: selectedRequests.length >= 2 ? '#fff' : 'var(--text-muted)'
              }}
            >
              {comparing ? (
                <>
                  <span className="animate-spin">⚡</span>
                  Comparing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Compare
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--primary-subtle)' }}>
              <Clock className="h-6 w-6" style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>All Clear!</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending requests. Use AI Chat to suggest changes.</p>
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div
              key={request.id}
              className={`p-4 rounded-xl transition-all ${analyzingId === request.id ? 'analyzing' : ''} ${selectedRequests.includes(request.id) ? 'ring-2' : ''}`}
              style={{ 
                background: 'var(--bg-subtle)', 
                border: `1px solid ${request.isBestOption ? 'var(--success)' : 'var(--border-color)'}`,
                ringColor: 'var(--primary)'
              }}
            >
              {/* Best Option Badge */}
              {request.isBestOption && (
                <div className="mb-2 px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-1" style={{ background: 'var(--success)', color: '#fff' }}>
                  <TrendingUp className="h-3 w-3" />
                  Best Option
                </div>
              )}
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                {/* Selection Checkbox */}
                {request.aiAnalysis && (
                  <input
                    type="checkbox"
                    checked={selectedRequests.includes(request.id)}
                    onChange={() => toggleSelection(request.id)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                )}
                <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{request.title}</h4>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {request.suggestedBy} · Day {request.day}
                  </p>
                </div>
              </div>

              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{request.description}</p>

              {/* AI Analysis */}
              {request.aiAnalysis && (
                <div className="p-3 rounded-lg mb-3" style={{ background: 'var(--secondary-subtle)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--secondary)' }}>
                      <Brain className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>AI Analysis</span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-color)" strokeWidth="3" />
                        <circle
                          cx="24" cy="24" r="20" fill="none"
                          stroke={request.aiAnalysis.score >= 7 ? 'var(--success)' : request.aiAnalysis.score >= 4 ? 'var(--warning)' : 'var(--error)'}
                          strokeWidth="3"
                          strokeDasharray={`${(request.aiAnalysis.score / 10) * 125.6} 125.6`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {request.aiAnalysis.score}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Feasibility</p>
                      <p className="text-sm font-medium" style={{ color: request.aiAnalysis.score >= 7 ? 'var(--success)' : request.aiAnalysis.score >= 4 ? 'var(--warning)' : 'var(--error)' }}>
                        {request.aiAnalysis.score >= 7 ? 'Highly Feasible' : request.aiAnalysis.score >= 4 ? 'Needs Adjustments' : 'Risky'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{request.aiAnalysis.reason}</p>

                  {request.aiAnalysis.suggestedChanges?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {request.aiAnalysis.suggestedChanges.map((change, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
                        >
                          {change}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Comparison Analysis */}
              {request.comparisonAnalysis && (
                <div className="p-3 rounded-lg mb-3" style={{ background: 'var(--primary-subtle)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>Places API Comparison</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Score:</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {request.comparisonAnalysis.score}/10
                      </span>
                    </div>
                    
                    {request.comparisonAnalysis.pros?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--success)' }}>Pros:</p>
                        <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                          {request.comparisonAnalysis.pros.map((pro, idx) => (
                            <li key={idx}>• {pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {request.comparisonAnalysis.cons?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--error)' }}>Cons:</p>
                        <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                          {request.comparisonAnalysis.cons.map((con, idx) => (
                            <li key={idx}>• {con}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {!request.aiAnalysis && (
                  <button
                    onClick={() => handleAnalyze(request.id)}
                    disabled={analyzingId === request.id}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary))', color: '#fff' }}
                  >
                    {analyzingId === request.id ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="animate-spin">⚡</span>
                        Analyzing...
                      </span>
                    ) : 'Analyze with AI'}
                  </button>
                )}
                {request.aiAnalysis && request.status === 'analyzed' && (
                  <>
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: 'var(--success)', color: '#fff' }}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)' }}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PendingRequests
