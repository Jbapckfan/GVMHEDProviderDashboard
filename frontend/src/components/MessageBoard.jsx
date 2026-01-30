import { useState, useEffect } from 'react'
import axios from 'axios'
import './MessageBoard.css'
import { API_BASE } from '../utils/api'
import { useToast } from './Toast'
import ConfirmModal from './ConfirmModal'

function MessageBoard() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMessage, setEditingMessage] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const toast = useToast()

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE}/messages`)
      setMessages(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingMessage({
      id: null,
      message: '',
      author: ''
    })
  }

  const handleEdit = (message) => {
    setEditingMessage({ ...message })
  }

  const handleSave = async () => {
    try {
      if (editingMessage.id) {
        await axios.put(`${API_BASE}/messages/${editingMessage.id}`, editingMessage)
        toast.success('Message updated.')
      } else {
        await axios.post(`${API_BASE}/messages`, editingMessage)
        toast.success('Message posted.')
      }
      setEditingMessage(null)
      fetchMessages()
    } catch (error) {
      toast.error('Failed to save message: ' + error.message)
    }
  }

  const handleDelete = () => {
    if (!editingMessage.id) return
    setConfirmAction({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await axios.delete(`${API_BASE}/messages/${editingMessage.id}`)
          toast.success('Message deleted.')
          setEditingMessage(null)
          fetchMessages()
        } catch (error) {
          toast.error('Failed to delete message: ' + error.message)
        }
      }
    })
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="card message-board-card">
        <div className="card-header">
          <h2 className="card-title">Provider Message Board</h2>
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-block" style={{ height: '72px' }}></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card message-board-card">
      <div className="card-header">
        <h2 className="card-title">Provider Message Board</h2>
        <button onClick={handleAddNew} className="edit-message-btn">
          + Post Message
        </button>
      </div>

      <div className="messages-list">
        {messages.map((message) => (
          <div key={message.id} className="message-item">
            <div className="message-header">
              <div className="message-author-info">
                <span className="message-author">{message.author}</span>
                <span className="message-time">{getTimeAgo(message.created_at)}</span>
              </div>
              <button onClick={() => handleEdit(message)} className="edit-message-btn-small">
                Edit
              </button>
            </div>
            <p className="message-content">{message.message}</p>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="empty-state">
            <p>No messages posted yet.</p>
            <p className="empty-hint">Click "Post Message" to share information with your team.</p>
          </div>
        )}
      </div>

      {editingMessage && (
        <div className="message-edit-modal" onClick={() => setEditingMessage(null)}>
          <div className="message-edit-form" onClick={(e) => e.stopPropagation()}>
            <h3>{editingMessage.id ? 'Edit Message' : 'Post New Message'}</h3>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g., Dr. Smith"
              value={editingMessage.author}
              onChange={(e) => setEditingMessage({ ...editingMessage, author: e.target.value })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Message
            </label>
            <textarea
              placeholder="e.g., Heads up - Dr. Womack (ortho) is out of town today through Sunday Nov 30th"
              value={editingMessage.message}
              onChange={(e) => setEditingMessage({ ...editingMessage, message: e.target.value })}
              rows={4}
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '2px solid var(--gray-300)', borderRadius: '8px', fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit' }}
            />

            <div className="message-edit-actions">
              {editingMessage.id && (
                <button onClick={handleDelete} className="btn-delete">
                  Delete
                </button>
              )}
              <button onClick={() => setEditingMessage(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-save">
                {editingMessage.id ? 'Save' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}

export default MessageBoard
