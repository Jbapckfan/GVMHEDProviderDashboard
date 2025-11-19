import './EDStatusCard.css'

function EDStatusCard({ status, onRefresh }) {
  if (!status) return null

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.high) return 'status-critical'
    if (value >= thresholds.medium) return 'status-warning'
    return 'status-good'
  }

  const waitTimeColor = getStatusColor(status.avg_wait_time, { high: 60, medium: 30 })
  const patientColor = getStatusColor(status.current_patients, { high: 20, medium: 15 })

  return (
    <div className="card ed-status-card">
      <div className="card-header">
        <h2 className="card-title">📊 Current ED Status</h2>
        <span className="status-badge status-active">LIVE</span>
      </div>

      <div className="status-grid">
        <div className={`status-item ${patientColor}`}>
          <div className="status-icon">👥</div>
          <div className="status-content">
            <div className="status-value">{status.current_patients}</div>
            <div className="status-label">Current Patients</div>
          </div>
        </div>

        <div className="status-item status-info">
          <div className="status-icon">⏳</div>
          <div className="status-content">
            <div className="status-value">{status.waiting_room}</div>
            <div className="status-label">Waiting Room</div>
          </div>
        </div>

        <div className="status-item status-good">
          <div className="status-icon">🛏️</div>
          <div className="status-content">
            <div className="status-value">{status.beds_available}</div>
            <div className="status-label">Beds Available</div>
          </div>
        </div>

        <div className={`status-item ${waitTimeColor}`}>
          <div className="status-icon">⏱️</div>
          <div className="status-content">
            <div className="status-value">{status.avg_wait_time} min</div>
            <div className="status-label">Avg Wait Time</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EDStatusCard
