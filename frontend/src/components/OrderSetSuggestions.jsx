import { useState, useEffect } from 'react'
import axios from 'axios'
import './OrderSetSuggestions.css'

const API_BASE = '/api'

function OrderSetSuggestions() {
  const [suggestions, setSuggestions] = useState([])
  const [newSuggestion, setNewSuggestion] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/order-set-suggestions`)
      setSuggestions(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newSuggestion.trim()) {
      alert('Please enter a suggestion')
      return
    }

    setSubmitting(true)

    try {
      await axios.post(`${API_BASE}/order-set-suggestions`, {
        suggestion: newSuggestion.trim(),
        author: author.trim() || 'Anonymous'
      })

      setNewSuggestion('')
      setAuthor('')
      fetchSuggestions()
      alert('Suggestion submitted successfully!')
    } catch (error) {
      console.error('Error submitting suggestion:', error)
      alert('Failed to submit suggestion')
    } finally {
      setSubmitting(false)
    }
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="card order-set-card">
      <div className="card-header">
        <h2 className="card-title">💡 Order Set Suggestions</h2>
        <span className="suggestion-count">{suggestions.length} suggestions</span>
      </div>

      <div className="suggestion-form-container">
        <form onSubmit={handleSubmit} className="suggestion-form">
          <textarea
            value={newSuggestion}
            onChange={(e) => setNewSuggestion(e.target.value)}
            placeholder="Enter your suggestion for order set changes..."
            className="suggestion-textarea"
            rows="3"
            disabled={submitting}
          />

          <div className="form-footer">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name (optional)"
              className="author-input"
              disabled={submitting}
            />
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : '📤 Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>

      <div className="suggestions-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner-small"></div>
            <p>Loading suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="empty-state">
            <p>No suggestions yet. Be the first to suggest an improvement!</p>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div key={suggestion.id} className="suggestion-item">
              <div className="suggestion-header">
                <span className="suggestion-author">
                  👤 {suggestion.author}
                </span>
                <span className="suggestion-time">
                  {getTimeAgo(suggestion.created_at)}
                </span>
              </div>
              <div className="suggestion-text">
                {suggestion.suggestion}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OrderSetSuggestions
