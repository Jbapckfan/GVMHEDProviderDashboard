import { useState } from 'react'
import './ShiftSchedule.css'

function ShiftSchedule({ shifts }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const getShiftIcon = (shiftType) => {
    if (shiftType.toLowerCase().includes('day')) return '☀️'
    if (shiftType.toLowerCase().includes('night')) return '🌙'
    return '🕐'
  }

  const getShiftColor = (shiftType) => {
    if (shiftType.toLowerCase().includes('day')) return 'shift-day'
    if (shiftType.toLowerCase().includes('night')) return 'shift-night'
    return 'shift-other'
  }

  const isCurrentShift = (shift) => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [startHour, startMin] = shift.start_time.split(':').map(Number)
    const [endHour, endMin] = shift.end_time.split(':').map(Number)
    const startTime = startHour * 60 + startMin
    let endTime = endHour * 60 + endMin

    // Handle shifts that cross midnight
    if (endTime < startTime) endTime += 24 * 60

    return shift.date === selectedDate && currentTime >= startTime && currentTime <= endTime
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">📅 Shift Schedule</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-input"
        />
      </div>

      <div className="shift-list">
        {shifts.length === 0 ? (
          <p className="empty-state">No shifts scheduled for this date</p>
        ) : (
          shifts.map((shift) => (
            <div
              key={shift.id}
              className={`shift-item ${getShiftColor(shift.shift_type)} ${isCurrentShift(shift) ? 'shift-active' : ''}`}
            >
              <div className="shift-icon">{getShiftIcon(shift.shift_type)}</div>
              <div className="shift-details">
                <div className="shift-provider">{shift.provider_name}</div>
                <div className="shift-info">
                  <span className="shift-type">{shift.shift_type}</span>
                  <span className="shift-time">
                    {shift.start_time} - {shift.end_time}
                  </span>
                </div>
              </div>
              {isCurrentShift(shift) && (
                <span className="current-badge">CURRENT</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ShiftSchedule
