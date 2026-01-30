import { useState, useEffect } from 'react'
import axios from 'axios'
import './NewsUpdates.css'
import { API_BASE } from '../utils/api'
import { useToast } from './Toast'
import ConfirmModal from './ConfirmModal'

function NewsUpdates() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingNews, setEditingNews] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const toast = useToast()

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const response = await axios.get(`${API_BASE}/news`)
      setNews(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching news:', error)
      setLoading(false)
    }
  }

  const verifyPassword = async () => {
    const password = prompt('Enter admin password:')
    if (!password) return false

    try {
      const response = await axios.post(`${API_BASE}/admin/verify`, { password })
      if (response.data.success) {
        setIsAuthenticated(true)
        return true
      } else {
        toast.error('Invalid password')
        return false
      }
    } catch (error) {
      toast.error('Invalid password')
      return false
    }
  }

  const handleEdit = async (newsItem) => {
    if (!isAuthenticated) {
      const verified = await verifyPassword()
      if (!verified) return
    }
    setEditingNews({ ...newsItem })
  }

  const handleAddNew = async () => {
    if (!isAuthenticated) {
      const verified = await verifyPassword()
      if (!verified) return
    }
    setEditingNews({
      id: null,
      title: '',
      content: '',
      priority: 'low',
      expires_at: null
    })
  }

  const handleSave = async () => {
    try {
      if (editingNews.id) {
        await axios.put(`${API_BASE}/admin/news/${editingNews.id}`, editingNews)
        toast.success('News updated.')
      } else {
        await axios.post(`${API_BASE}/admin/news`, editingNews)
        toast.success('News added.')
      }
      setEditingNews(null)
      fetchNews()
    } catch (error) {
      toast.error('Failed to save news: ' + error.message)
    }
  }

  const handleDelete = () => {
    if (!editingNews.id) return
    setConfirmAction({
      title: 'Delete Update',
      message: `Are you sure you want to delete "${editingNews.title}"?`,
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await axios.delete(`${API_BASE}/admin/news/${editingNews.id}`)
          toast.success('News deleted.')
          setEditingNews(null)
          fetchNews()
        } catch (error) {
          toast.error('Failed to delete news: ' + error.message)
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

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      'high': { label: 'URGENT', class: 'priority-high' },
      'medium': { label: 'Important', class: 'priority-medium' },
      'low': { label: 'Info', class: 'priority-low' }
    }
    return badges[priority] || badges['low']
  }

  if (loading) {
    return (
      <div className="card news-updates-card">
        <div className="card-header">
          <h2 className="card-title">Latest Updates</h2>
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2].map(i => (
            <div key={i} className="skeleton skeleton-block" style={{ height: '90px' }}></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card news-updates-card">
      <div className="card-header">
        <h2 className="card-title">Latest Updates</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="news-count">{news.length} updates</span>
          <button onClick={handleAddNew} className="edit-news-btn">
            + Add Update
          </button>
        </div>
      </div>

      <div className="news-list">
        {news.map((item) => {
          const badge = getPriorityBadge(item.priority)
          return (
            <div key={item.id} className={`news-item priority-${item.priority}`}>
              <div className="news-header">
                <span className={`priority-badge ${badge.class}`}>
                  {badge.label}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="news-date">
                    {getTimeAgo(item.created_at)}
                  </span>
                  <button onClick={() => handleEdit(item)} className="edit-news-btn-small">
                    Edit
                  </button>
                </div>
              </div>
              <h3 className="news-title">{item.title}</h3>
              <p className="news-content">{item.content}</p>
            </div>
          )
        })}

        {news.length === 0 && (
          <div className="empty-state">
            <p>No news or updates to display.</p>
            <p className="empty-hint">Click "Add Update" to create your first announcement.</p>
          </div>
        )}
      </div>

      {editingNews && (
        <div className="news-edit-modal" onClick={() => setEditingNews(null)}>
          <div className="news-edit-form" onClick={(e) => e.stopPropagation()}>
            <h3>{editingNews.id ? 'Edit Update' : 'Add New Update'}</h3>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Title
            </label>
            <input
              type="text"
              placeholder="e.g., New CT Scanner Available"
              value={editingNews.title}
              onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Content
            </label>
            <textarea
              placeholder="Enter the update details..."
              value={editingNews.content}
              onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
              rows={4}
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '2px solid var(--gray-300)', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Priority
            </label>
            <select
              value={editingNews.priority}
              onChange={(e) => setEditingNews({ ...editingNews, priority: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '2px solid var(--gray-300)', borderRadius: '8px', fontSize: '1rem' }}
            >
              <option value="low">Info</option>
              <option value="medium">Important</option>
              <option value="high">URGENT</option>
            </select>

            <div className="news-edit-actions">
              {editingNews.id && (
                <button onClick={handleDelete} className="btn-delete">
                  Delete
                </button>
              )}
              <button onClick={() => setEditingNews(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-save">
                Save
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

export default NewsUpdates
