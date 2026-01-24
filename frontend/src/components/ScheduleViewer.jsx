import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './ScheduleViewer.css'
import { API_BASE } from '../utils/api'

function ScheduleViewer() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedAt, setUploadedAt] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()) // 0-11
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('')
  const [baseSheetId] = useState('1eFtQiknDOiQSwJkYs-jC-w1_K0byKB5I9qkIE9xnnpU')
  const [publishedSheetId] = useState('2PACX-1vT7ADDc3-u6oNQzWMl8pS0Joz7zLuGUc5FuoZY8VVEtjmLoJxXeZnEBjwUKmAXmZ9gtSECi2kQXQ5EA')
  const [isGoogleSheets, setIsGoogleSheets] = useState(false)
  const [refreshKey, setRefreshKey] = useState(Date.now()) // Force iframe refresh
  const fileInputRef = useRef(null)

  // Mapping of "Month Year" to Google Sheets gid
  const sheetGids = {
    'December 2025': '256218995',
    'January 2026': '1997148602',
    'February 2026': '1342065365',
    'March 2026': '94782258',
  }

  // Refresh the Google Sheets iframe
  const refreshSheet = () => {
    setRefreshKey(Date.now())
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Build Google Sheets URL using gid - returns null if month not available
  const getSheetUrl = (monthIndex, year) => {
    const monthName = monthNames[monthIndex]
    const key = `${monthName} ${year}`
    const gid = sheetGids[key]
    if (!gid) return null
    // Use published web URL - works better on restricted networks
    return `https://docs.google.com/spreadsheets/d/e/${publishedSheetId}/pubhtml?gid=${gid}&single=true`
  }

  // Check if current month has a sheet available
  const hasSheetForMonth = (monthIndex, year) => {
    const monthName = monthNames[monthIndex]
    const key = `${monthName} ${year}`
    return !!sheetGids[key]
  }

  // Update Google Sheets URL when month changes
  useEffect(() => {
    if (isGoogleSheets) {
      const newUrl = getSheetUrl(currentMonth, currentYear)
      console.log('Switching to month:', monthNames[currentMonth], currentYear)
      setPreview(newUrl)
      setRefreshKey(Date.now()) // Force iframe to reload
    }
  }, [currentMonth, currentYear, isGoogleSheets, baseSheetId])

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const response = await axios.get(`${API_BASE}/schedule-file`)
        if (response.data.exists) {
          // File exists, load it
          const filePath = `${API_BASE}${response.data.path}?t=${Date.now()}`
          setPreview(filePath)
          setUploadedAt(new Date(response.data.uploadedAt))
          setIsGoogleSheets(false)
        } else {
          // No file uploaded, use Google Sheets with current month
          const embedUrl = getSheetUrl(currentMonth, currentYear)
          setPreview(embedUrl)
          setIsGoogleSheets(true)
        }
      } catch (error) {
        console.error('Error loading schedule:', error)
      }
    }

    loadSchedule()
  }, [])



  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (selectedFile) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']

    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Please upload an image (JPG, PNG, GIF)')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(selectedFile)

    uploadFile(selectedFile)
  }

  const uploadFile = async (fileToUpload) => {
    setUploading(true)

    const formData = new FormData()
    formData.append('file', fileToUpload)

    try {
      const response = await axios.post(`${API_BASE}/upload-schedule`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        setUploadedAt(new Date(response.data.uploadedAt))
        setPreview(`${API_BASE}${response.data.path}?t=${Date.now()}`)
        alert('Schedule uploaded successfully!')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the current schedule?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/schedule-file`)
      setFile(null)
      setPreview(null)
      setUploadedAt(null)
      alert('Schedule deleted successfully!')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date().getMonth())
    setCurrentYear(new Date().getFullYear())
  }

  // Get visible months: 1 previous + current + 3 future
  const getVisibleMonths = () => {
    const today = new Date()
    const todayMonth = today.getMonth()
    const todayYear = today.getFullYear()
    const months = []

    // Start from 1 month before current
    for (let i = -1; i <= 3; i++) {
      let targetMonth = todayMonth + i
      let targetYear = todayYear

      if (targetMonth < 0) {
        targetMonth += 12
        targetYear -= 1
      } else if (targetMonth > 11) {
        targetMonth -= 12
        targetYear += 1
      }

      const shortMonth = monthNames[targetMonth].substring(0, 3)
      const shortYear = String(targetYear).slice(-2)

      months.push({
        month: targetMonth,
        year: targetYear,
        label: `${shortMonth} '${shortYear}`,
        isCurrent: targetMonth === todayMonth && targetYear === todayYear
      })
    }

    return months
  }

  const handleGoogleSheetsUrl = () => {
    if (!googleSheetsUrl.trim()) {
      alert('Please enter a Google Sheets URL')
      return
    }
    
    // Convert Google Sheets URL to embed URL
    let embedUrl = googleSheetsUrl
    if (googleSheetsUrl.includes('/edit')) {
      embedUrl = googleSheetsUrl.replace('/edit', '/preview')
    }
    
    setPreview(embedUrl)
    const now = new Date()
    setUploadedAt(now)
    setIsGoogleSheets(true)
    setShowUrlInput(false)

    // Save to localStorage
    localStorage.setItem('scheduleGoogleSheetsUrl', embedUrl)
    localStorage.setItem('scheduleUploadedAt', now.toISOString())

    alert('Google Sheets schedule loaded successfully!')
  }

  return (
    <div className="card schedule-viewer-card">
      <div className="card-header">
        <h2 className="card-title">📅 Schedule</h2>

        {preview && (
          <div className="month-navigation">
            <button onClick={goToPreviousMonth} className="nav-btn" title="Previous Month">
              ◀
            </button>
            <span className="current-month">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button onClick={goToNextMonth} className="nav-btn" title="Next Month">
              ▶
            </button>
            <button onClick={goToCurrentMonth} className="today-btn" title="Go to Current Month">
              Today
            </button>
          </div>
        )}

        {isGoogleSheets ? (
          <span className="live-indicator" title="Data loads directly from Google Sheets">
            🟢 LIVE
          </span>
        ) : uploadedAt && (
          <span className="upload-time">
            Updated: {uploadedAt.toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="upload-container">
        {!preview && !isGoogleSheets ? (
          <>
            {!showUrlInput ? (
              <div>
                <div
                  className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={onButtonClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />

                  <div className="drop-zone-content">
                    <div className="upload-icon">📁</div>
                    <p className="drop-text">
                      Drag and drop your schedule screenshot
                    </p>
                    <p className="drop-subtext">or click to browse</p>
                    <p className="drop-hint">
                      Supports: JPG, PNG, GIF • Max 10MB
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button onClick={() => setShowUrlInput(true)} className="btn btn-secondary">
                    📊 Or Use Google Sheets URL
                  </button>
                </div>
              </div>
            ) : (
              <div className="url-input-container">
                <h3>Enter Google Sheets URL</h3>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleGoogleSheetsUrl} className="btn btn-primary">
                    Load Sheet
                  </button>
                  <button onClick={() => setShowUrlInput(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="preview-container">
            <div className="schedule-note">
              {preview && preview.includes('google.com') ? (
                <>
                  <strong>Live Data:</strong> This schedule loads directly from Google Sheets.
                  Click <strong>Refresh</strong> to ensure you're seeing the latest version.
                </>
              ) : (
                <>
                  <strong>Note:</strong> Upload one screenshot per month and use arrows to indicate which month you're viewing.
                </>
              )}
            </div>

            {isGoogleSheets ? (
              <>
                <div className="month-tabs">
                  {getVisibleMonths().map(({ month, year, label, isCurrent }) => (
                    <button
                      key={`${year}-${month}`}
                      className={`month-tab ${month === currentMonth && year === currentYear ? 'active' : ''} ${isCurrent ? 'current-month-tab' : ''}`}
                      onClick={() => {
                        setCurrentMonth(month)
                        setCurrentYear(year)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="iframe-wrapper">
                  {preview ? (
                    <iframe
                      key={`${currentMonth}-${currentYear}-${refreshKey}`}
                      src={preview}
                      title="Google Sheets Schedule"
                    />
                  ) : (
                    <div className="no-schedule-message">
                      <div className="no-schedule-icon">📅</div>
                      <h3>Schedule Not Yet Available</h3>
                      <p>{monthNames[currentMonth]} {currentYear} schedule has not been added yet.</p>
                      <p className="no-schedule-hint">Check back later or select a different month.</p>
                    </div>
                  )}
                </div>
              </>
            ) : preview ? (
              <img
                src={preview}
                alt="Schedule"
                className="schedule-image"
              />
            ) : null}

            <div className="preview-actions">
              {isGoogleSheets && (
                <button onClick={refreshSheet} className="btn btn-success">
                  🔄 Refresh
                </button>
              )}
              <button onClick={onButtonClick} className="btn btn-primary" disabled={uploading}>
                📤 Upload New
              </button>
              <button onClick={() => setShowUrlInput(true)} className="btn btn-secondary">
                📊 Change URL
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                🗑️ Delete
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="upload-progress">
            <div className="spinner-small"></div>
            <span>Uploading...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScheduleViewer
