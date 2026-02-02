import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE } from '../utils/api'
import './WhosOnNow.css'

const SHIFT_LABELS = [
  { position: 'Top', time: '7a\u20137p' },
  { position: 'Middle', time: '10a\u201310p' },
  { position: 'Bottom', time: '7p\u20137a' },
]

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function WhosOnNow() {
  const [todayProviders, setTodayProviders] = useState([])
  const [tomorrowProviders, setTomorrowProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedule()
    const interval = setInterval(fetchSchedule, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchSchedule = async () => {
    try {
      const now = new Date()
      const month = MONTH_NAMES[now.getMonth()]
      const year = now.getFullYear()
      const day = now.getDate()

      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowMonth = MONTH_NAMES[tomorrow.getMonth()]
      const tomorrowYear = tomorrow.getFullYear()
      const tomorrowDay = tomorrow.getDate()

      const todayRes = await axios.get(`${API_BASE}/schedule-data?month=${month}&year=${year}`)
      const todayData = todayRes.data?.calendar?.[day]?.providers || []
      setTodayProviders(todayData)

      if (tomorrowMonth === month && tomorrowYear === year) {
        const tomorrowData = todayRes.data?.calendar?.[tomorrowDay]?.providers || []
        setTomorrowProviders(tomorrowData)
      } else {
        try {
          const tomorrowRes = await axios.get(
            `${API_BASE}/schedule-data?month=${tomorrowMonth}&year=${tomorrowYear}`
          )
          const tomorrowData = tomorrowRes.data?.calendar?.[tomorrowDay]?.providers || []
          setTomorrowProviders(tomorrowData)
        } catch {
          setTomorrowProviders([])
        }
      }
    } catch {
      setTodayProviders([])
      setTomorrowProviders([])
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const tomorrowLabel = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const renderProviders = (providers, deckClass) => (
    <div className="whos-on-providers">
      {providers.length > 0 ? (
        providers.map((name, idx) => {
          const shift = SHIFT_LABELS[idx]
          return (
            <div key={idx} className={`on-shift-row ${deckClass || ''}`}>
              {shift && (
                <span className="shift-position">{shift.position}</span>
              )}
              <span className={`on-shift-badge ${deckClass || ''}`}>
                {shift && <span className="shift-time">{shift.time}</span>}
                {name}
              </span>
            </div>
          )
        })
      ) : (
        <span className="no-shift-data">No schedule data</span>
      )}
    </div>
  )

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
        {/* Today */}
        <div className="whos-on-section">
          <div className="whos-on-section-header">
            <div className="whos-on-label">
              <span className="pulse-dot"></span>
              On Shift Today
            </div>
            <div className="whos-on-date">{todayLabel}</div>
          </div>
          {renderProviders(todayProviders)}
        </div>

        <div className="whos-on-divider" />

        {/* On Deck */}
        <div className="whos-on-section on-deck-section">
          <div className="whos-on-section-header">
            <div className="whos-on-label on-deck-label">
              On Deck
            </div>
            <div className="whos-on-date">{tomorrowLabel}</div>
          </div>
          {renderProviders(tomorrowProviders, 'on-deck')}
        </div>
      </div>
    </div>
  )
}

export default WhosOnNow
