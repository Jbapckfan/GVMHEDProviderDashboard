import { useState, useEffect } from 'react'
import './AdminSettings.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const DB_CAPACITY = 9 * 1024 * 1024 * 1024 // 9 GB Turso limit
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB per-file limit

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(i > 1 ? 2 : 0)} ${units[i]}`
}

function AdminSettings({ onClose }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/admin/storage-stats`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const totalBase64 = stats
    ? stats.kpiDocuments.base64Size + stats.uploadedFiles.base64Size
    : 0
  const usagePercent = stats ? Math.min((totalBase64 / DB_CAPACITY) * 100, 100) : 0

  return (
    <div className="admin-settings-overlay" onClick={onClose}>
      <div className="admin-settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="admin-settings-header">
          <h2>Admin Settings</h2>
          <button className="admin-settings-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {loading && <div className="admin-settings-loading">Loading storage stats...</div>}
        {error && <div className="admin-settings-error">Error: {error}</div>}

        {stats && (
          <div className="admin-settings-body">
            <h3 className="admin-settings-section-title">Database Storage Usage</h3>

            <div className="storage-bar-container">
              <div className="storage-bar">
                <div
                  className={`storage-bar-fill${usagePercent > 80 ? ' storage-bar-warning' : ''}${usagePercent > 95 ? ' storage-bar-danger' : ''}`}
                  style={{ width: `${Math.max(usagePercent, 0.5)}%` }}
                />
              </div>
              <div className="storage-bar-label">
                <span>{formatBytes(totalBase64)} used</span>
                <span>{formatBytes(DB_CAPACITY)} capacity</span>
              </div>
            </div>

            <div className="storage-stats-grid">
              <div className="storage-stat-card">
                <div className="storage-stat-icon">&#128193;</div>
                <div className="storage-stat-info">
                  <span className="storage-stat-value">{stats.kpiDocuments.count}</span>
                  <span className="storage-stat-label">KPI Documents</span>
                </div>
                <div className="storage-stat-size">{formatBytes(stats.kpiDocuments.base64Size)}</div>
              </div>

              <div className="storage-stat-card">
                <div className="storage-stat-icon">&#128196;</div>
                <div className="storage-stat-info">
                  <span className="storage-stat-value">{stats.uploadedFiles.count}</span>
                  <span className="storage-stat-label">Uploaded Files</span>
                </div>
                <div className="storage-stat-size">{formatBytes(stats.uploadedFiles.base64Size)}</div>
              </div>
            </div>

            <div className="storage-detail-table">
              <div className="storage-detail-row">
                <span className="storage-detail-label">Total original size</span>
                <span className="storage-detail-value">
                  {formatBytes(stats.kpiDocuments.originalSize + stats.uploadedFiles.originalSize)}
                </span>
              </div>
              <div className="storage-detail-row">
                <span className="storage-detail-label">Total base64 size (DB footprint)</span>
                <span className="storage-detail-value">{formatBytes(totalBase64)}</span>
              </div>
              <div className="storage-detail-row">
                <span className="storage-detail-label">Base64 overhead</span>
                <span className="storage-detail-value">
                  ~{stats.kpiDocuments.originalSize + stats.uploadedFiles.originalSize > 0
                    ? Math.round(((totalBase64 / (stats.kpiDocuments.originalSize + stats.uploadedFiles.originalSize)) - 1) * 100)
                    : 0}%
                </span>
              </div>
            </div>

            <h3 className="admin-settings-section-title">Limits</h3>
            <div className="storage-limits">
              <div className="storage-limit-item">
                <span className="storage-limit-label">Per-file max upload</span>
                <span className="storage-limit-value">{formatBytes(MAX_FILE_SIZE)}</span>
              </div>
              <div className="storage-limit-item">
                <span className="storage-limit-label">Database capacity (Turso)</span>
                <span className="storage-limit-value">{formatBytes(DB_CAPACITY)}</span>
              </div>
              <div className="storage-limit-note">
                Base64 encoding adds ~33% overhead. A 10 MB file uses ~13.3 MB in the database.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSettings
