import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE } from '../utils/api'
import './WhosOnNow.css'

function WhosOnNow() {
  const [todayProviders, setTodayProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodaySchedule()
    // Refresh every 10 minutes
    const interval = setInterval(fetchTodaySchedule, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchTodaySchedule = async () => {
    try {
      const now = new Date()
      const monthNames = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December']
      const month = monthNames[now.getMonth()]
      const year = now.getFullYear()
      const day = now.getDate()

      const response = await axios.get(`${API_BASE}/schedule-data?month=${month}&year=${year}`)
      if (response.data?.calendar?.[day]) {
        setTodayProviders(response.data.calendar[day].providers || [])
      } else {
        setTodayProviders([])
      }
    } catch {
      setTodayProviders([])
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const dayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  if (loading) {
    return (
      <div className="card whos-on-card">
        <div className="whos-on-inner">
          <div className="whos-on-label">{'\u{1F7E2}'} On Shift Today</div>
          <div className="whos-on-loading">Loading schedule...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card whos-on-card">
      <div className="whos-on-inner">
        <div className="whos-on-left">
          <div className="whos-on-label">
            <span className="pulse-dot"></span>
            On Shift Today
          </div>
          <div className="whos-on-date">{dayLabel}</div>
        </div>
        <div className="whos-on-providers">
          {todayProviders.length > 0 ? (
            todayProviders.map((name, idx) => (
              <span key={idx} className="on-shift-badge">{name}</span>
            ))
          ) : (
            <span className="no-shift-data">No schedule data for today</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default WhosOnNow
