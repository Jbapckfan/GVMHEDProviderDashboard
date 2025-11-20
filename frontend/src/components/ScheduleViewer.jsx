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
  const fileInputRef = useRef(null)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    fetchExistingFile()
  }, [])

  const fetchExistingFile = async () => {
    try {
      const response = await axios.get(`${API_BASE}/schedule-file`)
      if (response.data.exists) {
        setPreview(`${API_BASE}${response.data.path}?t=${Date.now()}`)
        setUploadedAt(new Date(response.data.uploadedAt))
      }
    } catch (error) {
      console.error('Error fetching existing file:', error)
    }
  }

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
                Drag and drop your Google Sheets schedule screenshot
              </p>
              <p className="drop-subtext">or click to browse</p>
              <p className="drop-hint">
                Supports: JPG, PNG, GIF • Max 10MB
              </p>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <div className="schedule-note">
              <strong>Note:</strong> Navigation is for reference only. Upload one screenshot per month and use arrows to indicate which month you're viewing.
            </div>

            <img
              src={preview}
              alt="Schedule"
              className="schedule-image"
            />

            <div className="preview-actions">
              <button onClick={onButtonClick} className="btn btn-primary" disabled={uploading}>
                📤 Upload New
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
