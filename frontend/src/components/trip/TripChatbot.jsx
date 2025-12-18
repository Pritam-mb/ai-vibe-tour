import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Bot, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function TripChatbot({ trip, onSuggestionCreated }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: `Hi! I'm your AI trip assistant. I can help you add activities, restaurants, or make changes to your ${trip.name} itinerary.`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: `Trip to ${trip.destination} from ${trip.startDate} to ${trip.endDate}. Budget: $${trip.budget}.`
        })
      })

      const aiMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Great idea! I'll add "${input}" to your itinerary. Which day would you like to add this to?`,
        timestamp: new Date(),
        suggestion: { title: extractTitle(input), description: input, type: 'activity' }
      }

      setMessages(prev => [...prev, aiMessage])

      setTimeout(() => {
        const dayOptions = {
          id: Date.now() + 2,
          type: 'bot',
          text: 'Select a day:',
          timestamp: new Date(),
          options: trip.itinerary?.map((day) => ({
            label: `Day ${day.day} – ${day.date}`,
            value: day.day
          })) || []
        }
        setMessages(prev => [...prev, dayOptions])
      }, 500)

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "Sorry, I couldn't process that. Could you rephrase?",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const extractTitle = (text) => text.split(' ').slice(0, 5).join(' ')

  const handleDaySelect = (day, suggestion) => {
    const confirmMessage = {
      id: Date.now(),
      type: 'bot',
      text: `Perfect! Added your suggestion for Day ${day}. The team can review and approve it.`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, confirmMessage])

    if (onSuggestionCreated) {
      onSuggestionCreated({ title: suggestion.title, description: suggestion.description, day })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>AI Trip Assistant</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by Gemini</p>
        </div>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: message.type === 'user' ? 'var(--primary)' : 'var(--secondary-subtle)' }}
                >
                  {message.type === 'user' ? (
                    <User className="h-3.5 w-3.5" style={{ color: '#fff' }} />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--secondary)' }} />
                  )}
                </div>
                <div>
                  <div
                    className="rounded-xl px-3 py-2"
                    style={{
                      background: message.type === 'user' ? 'var(--primary)' : 'var(--bg-subtle)',
                      color: message.type === 'user' ? '#fff' : 'var(--text-primary)',
                      border: message.type === 'user' ? 'none' : '1px solid var(--border-color)'
                    }}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>

                  {message.options && (
                    <div className="mt-2 space-y-1.5">
                      {message.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            const prevMessage = messages.find(m => m.suggestion)
                            if (prevMessage) handleDaySelect(option.value, prevMessage.suggestion)
                          }}
                          className="block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                          style={{ background: 'var(--primary-subtle)', border: '1px solid rgba(14, 165, 233, 0.2)', color: 'var(--text-primary)' }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.2)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary-subtle)'}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--secondary-subtle)' }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--secondary)' }} />
            </div>
            <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--secondary)', animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--secondary)', animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--secondary)', animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your suggestion..."
            className="flex-1 px-3 py-2.5 rounded-lg text-sm"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-3 py-2.5 rounded-lg transition-all disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            { emoji: '🍽️', text: 'Add a local restaurant', color: 'var(--primary)' },
            { emoji: '🏛️', text: 'Visit a museum', color: 'var(--secondary)' },
            { emoji: '🛍️', text: 'Add shopping time', color: 'var(--warning)' }
          ].map((quick) => (
            <button
              key={quick.text}
              onClick={() => setInput(quick.text)}
              className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ background: `${quick.color}15`, border: `1px solid ${quick.color}30`, color: quick.color }}
            >
              {quick.emoji} {quick.text.split(' ').slice(-1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TripChatbot
