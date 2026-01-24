import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import './KPIImageUpload.css'
import { API_BASE } from '../utils/api'

function KPIImageUpload() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedAt, setUploadedAt] = useState(null)
  const [excelData, setExcelData] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Check if file already exists
    fetchExistingFile()
  }, [])

  useEffect(() => {
    // Parse Excel file whenever preview changes and it's an Excel file
    if (preview && (preview.includes('.xlsx') || preview.includes('.xls'))) {
      parseExcelFile(preview)
    }
  }, [preview])

  const fetchExistingFile = async () => {
    try {
      const response = await axios.get(`${API_BASE}/kpi-file`)
      if (response.data.exists) {
        const filePath = `${API_BASE}${response.data.path}?t=${Date.now()}`
        setPreview(filePath)
        setFile({ name: response.data.filename, path: filePath })
        setUploadedAt(new Date(response.data.uploadedAt))
        
        // If it's an Excel file, parse it immediately
        if (response.data.filename.includes('.xlsx') || response.data.filename.includes('.xls')) {
          console.log('Excel file detected, parsing:', response.data.filename)
          setTimeout(() => parseExcelFile(filePath), 100)
        }
      }
    } catch (error) {
      console.error('Error fetching existing file:', error)
    }
  }

  const parseExcelFile = async (filePath) => {
    try {
      console.log('Parsing Excel file:', filePath)
      const response = await fetch(filePath)
      console.log('Fetch response:', response.status, response.ok)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      console.log('ArrayBuffer size:', arrayBuffer.byteLength)
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      console.log('Workbook sheets:', workbook.SheetNames)
      
      // Get first sheet
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      console.log('Excel data parsed, rows:', jsonData.length)
      console.log('First 3 rows:', jsonData.slice(0, 3))
      
      if (jsonData.length === 0) {
        console.error('No data in Excel file!')
        setExcelData([['No data found in Excel file']])
      } else {
        setExcelData(jsonData)
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error)
      console.error('Error stack:', error.stack)
      setExcelData([['Error loading Excel file: ' + error.message]])
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
        const filePath = `${API_BASE}${response.data.path}?t=${Date.now()}`
        
        // For images, update preview with server path
        if (fileToUpload.type.startsWith('image/')) {
          setPreview(filePath)
        } else {
          // For Excel files, parse and display
          setPreview(filePath)
          parseExcelFile(filePath)
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
            {preview && !preview.startsWith('data:image') && (preview.includes('.xlsx') || preview.includes('.xls') || (file && file.name && (file.name.includes('.xlsx') || file.name.includes('.xls')))) ? (
              <div className="excel-preview">
                <div className="excel-header">
                  <div className="excel-icon">📊</div>
                  <h3>KPI Metrics</h3>
                  <p className="file-name">{file?.name || 'kpi-metrics.xlsx'}</p>
                </div>
                
                {excelData && excelData.length > 0 ? (
                  <div className="excel-table-container">
                    <table className="excel-table">
                      <thead>
                        <tr>
                          {excelData[0].map((header, index) => (
                            <th key={index}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="loading-excel">Loading spreadsheet data...</div>
                )}
                
                <a href={preview} download className="btn btn-success" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
                  📥 Download Excel File
                </a>
              </div>
            ) : (
              <img
                src={preview}
                alt="KPI Metrics"
                className="kpi-image"
              />
            )}
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
