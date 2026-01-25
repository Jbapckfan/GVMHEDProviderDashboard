import { useState, useEffect } from 'react'
import axios from 'axios'
import './OrderSetSuggestions.css'
import { API_BASE } from '../utils/api'

function OrderSetSuggestions() {
  const [suggestions, setSuggestions] = useState([])
  const [newSuggestion, setNewSuggestion] = useState('')
  const [author, setAuthor] = useState('')
  const [selectedOrderSet, setSelectedOrderSet] = useState('')
  const [customOrderSet, setCustomOrderSet] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingSuggestion, setEditingSuggestion] = useState(null)

  const orderSetOptions = [
    'ED Chest Pain',
    'ED Abdominal Pain',
    'ED Stroke',
    'ED Headache',
    'ED Fever',
    'ED Sepsis',
    'ED Psych/Mental Health',
    'ED Respiratory Distress',
    'ED Altered Mental Status',
    'ED Trauma',
    'ED Back Pain',
    'ED Kidney Stone',
    'ED Seizure',
    'ED Pediatric General',
    'ED Pediatric Trauma'
  ]

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

    if (!selectedOrderSet) {
      alert('Please select an order set')
      return
    }

    if (selectedOrderSet === 'Other' && !customOrderSet.trim()) {
      alert('Please enter the order set name')
      return
    }

    if (!newSuggestion.trim()) {
      alert('Please enter a suggestion')
      return
    }

    const orderSetName = selectedOrderSet === 'Other'
      ? `ED ${customOrderSet.trim()}`
      : selectedOrderSet

    setSubmitting(true)

    try {
      await axios.post(`${API_BASE}/order-set-suggestions`, {
        suggestion: `[${orderSetName}] ${newSuggestion.trim()}`,
        author: author.trim() || 'Anonymous'
      })

      setNewSuggestion('')
      setAuthor('')
      setSelectedOrderSet('')
      setCustomOrderSet('')
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

  const handleEdit = (suggestion) => {
    setEditingSuggestion({ ...suggestion })
  }

  const handleSaveEdit = async () => {
    if (!editingSuggestion.suggestion.trim()) {
      alert('Please enter a suggestion')
      return
    }

    try {
      await axios.put(`${API_BASE}/order-set-suggestions/${editingSuggestion.id}`, {
        suggestion: editingSuggestion.suggestion.trim(),
        author: editingSuggestion.author.trim() || 'Anonymous'
      })
      setEditingSuggestion(null)
      fetchSuggestions()
      alert('Suggestion updated successfully!')
    } catch (error) {
      console.error('Error updating suggestion:', error)
      alert('Failed to update suggestion')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this suggestion?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/order-set-suggestions/${editingSuggestion.id}`)
      setEditingSuggestion(null)
      fetchSuggestions()
      alert('Suggestion deleted successfully!')
    } catch (error) {
      console.error('Error deleting suggestion:', error)
      alert('Failed to delete suggestion')
    }
  }

  return (
    <div className="card order-set-card">
      <div className="card-header">
        <h2 className="card-title">💡 Order Set Suggestions</h2>
        <span className="suggestion-count">{suggestions.length} suggestions</span>
      </div>

      <div className="suggestion-form-container">
        <form onSubmit={handleSubmit} className="suggestion-form">
          <select
            value={selectedOrderSet}
            onChange={(e) => setSelectedOrderSet(e.target.value)}
            className="order-set-select"
            disabled={submitting}
          >
            <option value="">Select Order Set...</option>
            {orderSetOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
            <option value="Other">Other (specify below)</option>
          </select>

          {selectedOrderSet === 'Other' && (
            <input
              type="text"
              value={customOrderSet}
              onChange={(e) => setCustomOrderSet(e.target.value)}
              placeholder="Enter order set name (e.g., Diabetic Ketoacidosis)"
              className="custom-order-set-input"
              disabled={submitting}
            />
          )}

          <textarea
            value={newSuggestion}
            onChange={(e) => setNewSuggestion(e.target.value)}
            placeholder="Enter your suggestion for this order set..."
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
                <div className="suggestion-header-right">
                  <span className="suggestion-time">
                    {getTimeAgo(suggestion.created_at)}
                  </span>
                  <button
                    onClick={() => handleEdit(suggestion)}
                    className="edit-suggestion-btn"
                    title="Edit suggestion"
                  >
                    ✏️
                  </button>
                </div>
              </div>
              <div className="suggestion-text">
                {suggestion.suggestion}
              </div>
            </div>
          ))
        )}
      </div>

      {editingSuggestion && (
        <div className="suggestion-edit-modal" onClick={() => setEditingSuggestion(null)}>
          <div className="suggestion-edit-form" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Suggestion</h3>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Author
            </label>
            <input
              type="text"
              value={editingSuggestion.author}
              onChange={(e) => setEditingSuggestion({ ...editingSuggestion, author: e.target.value })}
              placeholder="Author name"
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Suggestion
            </label>
            <textarea
              value={editingSuggestion.suggestion}
              onChange={(e) => setEditingSuggestion({ ...editingSuggestion, suggestion: e.target.value })}
              placeholder="Enter suggestion..."
              rows="4"
            />

            <div className="suggestion-edit-actions">
              <button onClick={handleDelete} className="btn-delete">
                🗑️ Delete
              </button>
              <button onClick={() => setEditingSuggestion(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="btn-save">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderSetSuggestions
