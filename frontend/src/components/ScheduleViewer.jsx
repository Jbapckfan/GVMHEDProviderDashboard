import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './ScheduleViewer.css'

const API_BASE = '/api'

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
  const [isGoogleSheets, setIsGoogleSheets] = useState(false)
  const fileInputRef = useRef(null)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Map of month names to Google Sheets gids (you'll need to fill in the missing ones)
  const monthGids = {
    'November': '14906086',
    'December': '256218995',
    // Add other months as needed
  }

  // Update Google Sheets URL when month changes
  useEffect(() => {
    if (isGoogleSheets) {
      const monthName = monthNames[currentMonth]
      const gid = monthGids[monthName]

      if (gid) {
        const newUrl = `https://docs.google.com/spreadsheets/d/${baseSheetId}/preview?gid=${gid}#gid=${gid}`
        console.log('Switching to month:', monthName, 'gid:', gid)
        setPreview(newUrl)
      } else {
        console.warn('No gid found for month:', monthName)
      }
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
          const monthName = monthNames[currentMonth]
          const gid = monthGids[monthName] || '14906086' // Default to November
          const embedUrl = `https://docs.google.com/spreadsheets/d/${baseSheetId}/preview?gid=${gid}#gid=${gid}`
          setPreview(embedUrl)
          setUploadedAt(new Date())
          setIsGoogleSheets(true)
          localStorage.setItem('scheduleGoogleSheetsUrl', embedUrl)
          localStorage.setItem('scheduleUploadedAt', new Date().toISOString())
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

        {uploadedAt && (
          <span className="upload-time">
            Updated: {uploadedAt.toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="upload-container">
        {!preview ? (
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
              <strong>Note:</strong> Navigation is for reference only. {preview.includes('google.com') ? 'Use the Google Sheets interface to navigate.' : 'Upload one screenshot per month and use arrows to indicate which month you\'re viewing.'}
            </div>

            {preview.includes('google.com') ? (
              <iframe
                src={preview}
                style={{ width: '100%', height: '600px', border: 'none' }}
                title="Google Sheets Schedule"
              />
            ) : (
              <img
                src={preview}
                alt="Schedule"
                className="schedule-image"
              />
            )}

            <div className="preview-actions">
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
