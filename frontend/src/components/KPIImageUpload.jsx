import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './KPIImageUpload.css'

const API_BASE = '/api'

function KPIImageUpload() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedAt, setUploadedAt] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Check if file already exists
    fetchExistingFile()
  }, [])

  const fetchExistingFile = async () => {
    try {
      const response = await axios.get(`${API_BASE}/kpi-file`)
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
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']

    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Please upload an image (JPG, PNG, GIF) or Excel file (.xlsx, .xls)')
      return
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      // For Excel files, show a placeholder
      setPreview(null)
    }

    // Auto-upload
    uploadFile(selectedFile)
  }

  const uploadFile = async (fileToUpload) => {
    setUploading(true)

    const formData = new FormData()
    formData.append('file', fileToUpload)

    try {
      const response = await axios.post(`${API_BASE}/upload-kpi`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        setUploadedAt(new Date(response.data.uploadedAt))
        // For images, update preview with server path
        if (fileToUpload.type.startsWith('image/')) {
          setPreview(`${API_BASE}${response.data.path}?t=${Date.now()}`)
        }
        alert('KPI file uploaded successfully!')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the current KPI file?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/kpi-file`)
      setFile(null)
      setPreview(null)
      setUploadedAt(null)
      alert('KPI file deleted successfully!')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="card kpi-upload-card">
      <div className="card-header">
        <h2 className="card-title">📊 Department KPI Metrics</h2>
        {uploadedAt && (
          <span className="upload-time">
            Last updated: {uploadedAt.toLocaleString()}
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
              accept="image/*,.xlsx,.xls"
              onChange={handleChange}
              style={{ display: 'none' }}
            />

            <div className="drop-zone-content">
              <div className="upload-icon">📁</div>
              <p className="drop-text">
                Drag and drop your KPI screenshot here
              </p>
              <p className="drop-subtext">or click to browse</p>
              <p className="drop-hint">
                Supports: JPG, PNG, GIF, Excel (.xlsx, .xls) • Max 10MB
              </p>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <img
              src={preview}
              alt="KPI Metrics"
              className="kpi-image"
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

export default KPIImageUpload
