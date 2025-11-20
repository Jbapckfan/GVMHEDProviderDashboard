import { useState, useEffect } from 'react'
import axios from 'axios'
import './NewsUpdates.css'

const API_BASE = '/api'

function NewsUpdates() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

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
          <h2 className="card-title">📰 Latest Updates</h2>
        </div>
        <div className="loading-small">Loading...</div>
      </div>
    )
  }

  return (
    <div className="card news-updates-card">
      <div className="card-header">
        <h2 className="card-title">📰 Latest Updates</h2>
        <span className="news-count">{news.length} updates</span>
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
                <span className="news-date">
                  {getTimeAgo(item.created_at)}
                </span>
              </div>
              <h3 className="news-title">{item.title}</h3>
              <p className="news-content">{item.content}</p>
            </div>
          )
        })}

        {news.length === 0 && (
          <div className="empty-state">
            <p>No news or updates to display.</p>
            <p className="empty-hint">Check back later for announcements.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsUpdates
