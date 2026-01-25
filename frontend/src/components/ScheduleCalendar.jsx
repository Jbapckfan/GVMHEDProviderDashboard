import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE } from '../utils/api'
import './ScheduleCalendar.css'

function ScheduleCalendar() {
  const [scheduleData, setScheduleData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [availableMonths, setAvailableMonths] = useState([])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Fetch available months on mount
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const response = await axios.get(`${API_BASE}/schedule-months`)
        const months = response.data.months.map(m => ({
          month: monthNames.indexOf(m.month),
          year: m.year,
          label: `${m.month.substring(0, 3)} '${String(m.year).slice(-2)}`
        }))
        setAvailableMonths(months)

        // Set current selection to current month if available, otherwise first available
        const today = new Date()
        const currentAvailable = months.find(m => m.month === today.getMonth() && m.year === today.getFullYear())
        if (currentAvailable) {
          setCurrentMonth(currentAvailable.month)
          setCurrentYear(currentAvailable.year)
        } else if (months.length > 0) {
          // Default to the most recent month
          const latest = months[months.length - 1]
          setCurrentMonth(latest.month)
          setCurrentYear(latest.year)
        }
      } catch (err) {
        console.error('Error fetching available months:', err)
      }
    }
    fetchMonths()
  }, [])

  useEffect(() => {
    if (availableMonths.length > 0) {
      fetchSchedule()
    }
  }, [currentMonth, currentYear, availableMonths])

  const fetchSchedule = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_BASE}/schedule-data`, {
        params: {
          month: monthNames[currentMonth],
          year: currentYear
        }
      })
      setScheduleData(response.data)
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setError(err.response?.data?.error || 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar grid
  const generateCalendarGrid = () => {
    if (!scheduleData) return []

    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const grid = []
    let dayCount = 1

    // Create 6 weeks max
    for (let week = 0; week < 6; week++) {
      const weekRow = []
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        if (week === 0 && dayOfWeek < startDayOfWeek) {
          // Empty cells before month starts
          weekRow.push({ day: null, providers: [] })
        } else if (dayCount > daysInMonth) {
          // Empty cells after month ends
          weekRow.push({ day: null, providers: [] })
        } else {
          const dayData = scheduleData.calendar[dayCount] || { providers: [] }
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          const isToday =
            dayCount === new Date().getDate() &&
            currentMonth === new Date().getMonth() &&
            currentYear === new Date().getFullYear()

          weekRow.push({
            day: dayCount,
            providers: dayData.providers || [],
            isWeekend,
            isToday
          })
          dayCount++
        }
      }
      grid.push(weekRow)
      if (dayCount > daysInMonth) break
    }

    return grid
  }

  const isCurrentMonth = (month, year) => {
    const today = new Date()
    return month === today.getMonth() && year === today.getFullYear()
  }

  // Count shifts for a specific provider
  const getProviderShiftCount = (providerName) => {
    if (!scheduleData?.calendar || !providerName) return 0
    return Object.values(scheduleData.calendar).filter(day =>
      day.providers?.includes(providerName)
    ).length
  }

  // Get all unique providers for the legend
  const getUniqueProviders = () => {
    if (!scheduleData?.calendar) return []
    const providers = new Set()
    Object.values(scheduleData.calendar).forEach(day => {
      day.providers?.forEach(p => providers.add(p))
    })
    return Array.from(providers).sort()
  }

  // Toggle provider selection
  const handleProviderClick = (providerName) => {
    setSelectedProvider(prev => prev === providerName ? null : providerName)
  }

  // Check if a cell should be highlighted
  const isCellHighlighted = (providers) => {
    if (!selectedProvider) return false
    return providers.includes(selectedProvider)
  }

  return (
    <div className="card schedule-calendar-card">
      <div className="card-header">
        <h2 className="card-title">📅 Schedule</h2>
        <span className="live-indicator" title="Data pulled live from Google Sheets">
          🟢 LIVE
        </span>
        <div className="month-tabs">
          {availableMonths.map(({ month, year, label }) => (
            <button
              key={`${year}-${month}`}
              className={`month-tab ${month === currentMonth && year === currentYear ? 'active' : ''} ${isCurrentMonth(month, year) ? 'current' : ''}`}
              onClick={() => {
                setCurrentMonth(month)
                setCurrentYear(year)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-header-left">
            <h3 className="calendar-title">{monthNames[currentMonth]} {currentYear}</h3>
            {selectedProvider && (
              <span className="data-stats selected-provider-stats">
                {selectedProvider}: {getProviderShiftCount(selectedProvider)} shifts
                <button className="clear-selection" onClick={() => setSelectedProvider(null)}>✕</button>
              </span>
            )}
          </div>
          <button onClick={fetchSchedule} className="refresh-btn" disabled={loading}>
            {loading ? '...' : '↻'} Refresh
          </button>
        </div>

        {loading && (
          <div className="calendar-loading">
            <div className="spinner"></div>
            <p>Loading schedule...</p>
          </div>
        )}

        {error && (
          <div className="calendar-error">
            <p>{error}</p>
            <button onClick={fetchSchedule}>Try Again</button>
          </div>
        )}

        {!loading && !error && scheduleData && (
          <>
            <div className="calendar-grid">
            <div className="calendar-day-headers">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="day-header">{day}</div>
              ))}
            </div>

            <div className="calendar-body">
              {generateCalendarGrid().map((week, weekIndex) => (
                <div key={weekIndex} className="calendar-week">
                  {week.map((cell, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`calendar-cell ${cell.day ? '' : 'empty'} ${cell.isWeekend ? 'weekend' : ''} ${cell.isToday ? 'today' : ''}`}
                    >
                      {cell.day && (
                        <>
                          <div className="cell-day">{cell.day}</div>
                          <div className="cell-providers">
                            {cell.providers.map((provider, idx) => (
                              <div
                                key={idx}
                                className={`provider-name ${selectedProvider === provider ? 'selected' : ''} ${selectedProvider && selectedProvider !== provider ? 'dimmed' : ''}`}
                                onClick={() => handleProviderClick(provider)}
                                title={`Click to highlight all ${provider}'s shifts`}
                              >
                                {provider}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ScheduleCalendar
