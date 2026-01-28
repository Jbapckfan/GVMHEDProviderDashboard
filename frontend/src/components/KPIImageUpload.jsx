import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import './KPIImageUpload.css'
import { API_BASE } from '../utils/api'

// Helper to format cell values nicely
const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return ''

  if (typeof value === 'number') {
    if (value > 0 && value < 1 && value !== Math.floor(value)) {
      return `${(value * 100).toFixed(1)}%`
    }
    if (value >= 1000) {
      return value.toLocaleString()
    }
    if (value !== Math.floor(value)) {
      return value.toFixed(1)
    }
    return value.toString()
  }

  if (typeof value === 'string') {
    if (value.startsWith('[') && value.endsWith(']')) {
      return value
    }
    return value
  }

  return String(value)
}

function KPIImageUpload() {
  const [documents, setDocuments] = useState([])
  const [activeDocId, setActiveDocId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [editingTitle, setEditingTitle] = useState(null)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [excelData, setExcelData] = useState({})
  const [loadingContent, setLoadingContent] = useState({})
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  // When active document changes, load its content if not already loaded
  useEffect(() => {
    if (activeDocId && !excelData[activeDocId]) {
      loadDocumentContent(activeDocId)
    }
  }, [activeDocId])

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/kpi-documents`)
      setDocuments(response.data)
      // Set first document as active if none selected
      if (response.data.length > 0 && !activeDocId) {
        setActiveDocId(response.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const loadDocumentContent = async (docId) => {
    const doc = documents.find(d => d.id === docId)
    if (!doc) return

    setLoadingContent(prev => ({ ...prev, [docId]: true }))

    try {
      const downloadUrl = `${API_BASE}/kpi-documents/${docId}/download?t=${Date.now()}`

      // Check if it's an Excel file
      const isExcel = doc.filename?.toLowerCase().endsWith('.xlsx') ||
                      doc.filename?.toLowerCase().endsWith('.xls')

      if (isExcel) {
        await parseExcelFile(downloadUrl, docId)
      } else {
        // For images and PDFs, just store the URL
        setExcelData(prev => ({
          ...prev,
          [docId]: { type: 'file', url: downloadUrl, mimetype: doc.mimetype }
        }))
      }
    } catch (error) {
      console.error('Error loading document content:', error)
    } finally {
      setLoadingContent(prev => ({ ...prev, [docId]: false }))
    }
  }

  const parseExcelFile = async (filePath, docId) => {
    try {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length === 0) {
        setExcelData(prev => ({
          ...prev,
          [docId]: { type: 'excel', data: [['No data found in Excel file']] }
        }))
      } else {
        let headerRowIndex = 0
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          const row = jsonData[i]
          if (row && row[0] && typeof row[0] === 'string' && row[0].length > 3) {
            headerRowIndex = i
            break
          }
        }

        const titleRow = headerRowIndex > 0 ? jsonData[0] : null
        const processedData = jsonData.slice(headerRowIndex)

        setExcelData(prev => ({
          ...prev,
          [docId]: {
            type: 'excel',
            title: titleRow,
            data: processedData,
            hasTitle: headerRowIndex > 0,
            url: filePath
          }
        }))
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error)
      setExcelData(prev => ({
        ...prev,
        [docId]: { type: 'error', message: error.message }
      }))
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Handle multiple files
      Array.from(e.dataTransfer.files).forEach(file => handleFile(file))
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => handleFile(file))
    }
  }

  const handleFile = async (selectedFile) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/pdf'
    ]
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.xlsx', '.xls', '.pdf']

    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))
    const isValidType = allowedTypes.includes(selectedFile.type) || allowedExtensions.includes(fileExtension)

    if (!isValidType) {
      alert('Please upload an image (JPG, PNG, GIF), Excel file (.xlsx, .xls), or PDF')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    await uploadFile(selectedFile)
  }

  const uploadFile = async (fileToUpload) => {
    setUploading(true)

    const formData = new FormData()
    formData.append('file', fileToUpload)
    // Default title is filename without extension
    const defaultTitle = fileToUpload.name.replace(/\.[^/.]+$/, '')
    formData.append('title', defaultTitle)

    try {
      const response = await axios.post(`${API_BASE}/kpi-documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        await fetchDocuments()
        // Set the new document as active
        if (response.data.id) {
          setActiveDocId(response.data.id)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId, e) => {
    e.stopPropagation()

    if (!window.confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/kpi-documents/${docId}`)

      // Remove from local state
      setDocuments(prev => prev.filter(d => d.id !== docId))
      setExcelData(prev => {
        const newData = { ...prev }
        delete newData[docId]
        return newData
      })

      // If deleted doc was active, switch to another
      if (activeDocId === docId) {
        const remaining = documents.filter(d => d.id !== docId)
        setActiveDocId(remaining.length > 0 ? remaining[0].id : null)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document')
    }
  }

  const startEditingTitle = (docId, currentTitle, e) => {
    e.stopPropagation()
    setEditingTitle(docId)
    setEditTitleValue(currentTitle)
  }

  const saveTitle = async (docId) => {
    if (!editTitleValue.trim()) {
      setEditingTitle(null)
      return
    }

    try {
      await axios.put(`${API_BASE}/kpi-documents/${docId}`, { title: editTitleValue.trim() })
      setDocuments(prev => prev.map(d =>
        d.id === docId ? { ...d, title: editTitleValue.trim() } : d
      ))
    } catch (error) {
      console.error('Error updating title:', error)
      alert('Failed to update title')
    } finally {
      setEditingTitle(null)
    }
  }

  const handleTitleKeyDown = (e, docId) => {
    if (e.key === 'Enter') {
      saveTitle(docId)
    } else if (e.key === 'Escape') {
      setEditingTitle(null)
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const activeDoc = documents.find(d => d.id === activeDocId)
  const activeContent = activeDocId ? excelData[activeDocId] : null

  const renderDocumentContent = () => {
    if (!activeDoc) return null

    if (loadingContent[activeDocId]) {
      return (
        <div className="loading-content">
          <div className="spinner-small"></div>
          <span>Loading document...</span>
        </div>
      )
    }

    if (!activeContent) {
      return (
        <div className="loading-content">
          <span>Click to load document content</span>
        </div>
      )
    }

    if (activeContent.type === 'error') {
      return <div className="error-message">Error loading document: {activeContent.message}</div>
    }

    if (activeContent.type === 'excel') {
      return (
        <div className="excel-preview">
          {activeContent.hasTitle && activeContent.title && (
            <div className="excel-title-row">
              {activeContent.title.filter(cell => cell).map((cell, index) => (
                <span key={index} className="excel-title-cell">{cell}</span>
              ))}
            </div>
          )}
          {activeContent.data && activeContent.data.length > 0 ? (
            <div className="excel-table-container">
              <table className="excel-table">
                <thead>
                  <tr>
                    {activeContent.data[0].map((header, index) => (
                      <th key={index}>{header || ''}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeContent.data.slice(1).map((row, rowIndex) => {
                    const nonEmptyCells = row.filter(cell => cell !== null && cell !== undefined && cell !== '').length
                    const isSection = nonEmptyCells === 1 && row[0]

                    return (
                      <tr key={rowIndex} className={isSection ? 'section-row' : ''}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className={cellIndex === 0 ? 'metric-name' : 'metric-value'}>
                            {formatCell(cell)}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="loading-excel">No data found</div>
          )}
          <a href={activeContent.url} download className="btn btn-success download-btn">
            Download Excel File
          </a>
        </div>
      )
    }

    // Image or PDF
    if (activeContent.type === 'file') {
      if (activeContent.mimetype?.startsWith('image/')) {
        return (
          <div className="image-preview">
            <img src={activeContent.url} alt={activeDoc.title} className="kpi-image" />
          </div>
        )
      }

      if (activeContent.mimetype === 'application/pdf') {
        return (
          <div className="pdf-preview">
            <iframe
              src={activeContent.url}
              title={activeDoc.title}
              className="pdf-frame"
            />
            <a href={activeContent.url} download className="btn btn-success download-btn">
              Download PDF
            </a>
          </div>
        )
      }

      // Generic file download
      return (
        <div className="file-preview">
          <div className="file-icon">
            {activeDoc.filename?.endsWith('.pdf') ? '📄' : '📁'}
          </div>
          <p>{activeDoc.filename}</p>
          <a href={activeContent.url} download className="btn btn-success">
            Download File
          </a>
        </div>
      )
    }

    return null
  }

  return (
    <div className="card kpi-upload-card">
      <div className="card-header">
        <h2 className="card-title">Department KPI Documents</h2>
        <button onClick={onButtonClick} className="btn btn-primary btn-sm" disabled={uploading}>
          {uploading ? 'Uploading...' : '+ Add Document'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.xlsx,.xls,.pdf"
        onChange={handleChange}
        multiple
        style={{ display: 'none' }}
      />

      {/* Document Tabs */}
      {documents.length > 0 && (
        <div className="document-tabs">
          {documents.map(doc => (
            <div
              key={doc.id}
              className={`document-tab ${activeDocId === doc.id ? 'active' : ''}`}
              onClick={() => setActiveDocId(doc.id)}
            >
              {editingTitle === doc.id ? (
                <input
                  type="text"
                  className="tab-title-input"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onBlur={() => saveTitle(doc.id)}
                  onKeyDown={(e) => handleTitleKeyDown(e, doc.id)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <>
                  <span
                    className="tab-title"
                    onDoubleClick={(e) => startEditingTitle(doc.id, doc.title, e)}
                    title="Double-click to edit title"
                  >
                    {doc.title}
                  </span>
                  <span className="tab-file-type">
                    {doc.filename?.split('.').pop().toUpperCase()}
                  </span>
                </>
              )}
              <button
                className="tab-delete-btn"
                onClick={(e) => handleDelete(doc.id, e)}
                title="Delete document"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="upload-container">
        {documents.length === 0 ? (
          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
          >
            <div className="drop-zone-content">
              <div className="upload-icon">📁</div>
              <p className="drop-text">
                Drag and drop your KPI documents here
              </p>
              <p className="drop-subtext">or click to browse</p>
              <p className="drop-hint">
                Supports: JPG, PNG, GIF, Excel (.xlsx, .xls), PDF | Max 10MB
              </p>
            </div>
          </div>
        ) : (
          <div className="document-content">
            {activeDoc && (
              <div className="content-header">
                <span className="content-filename">{activeDoc.filename}</span>
                <span className="content-date">
                  Uploaded: {new Date(activeDoc.uploaded_at).toLocaleDateString()}
                </span>
              </div>
            )}
            {renderDocumentContent()}

            {/* Drop zone for adding more files */}
            <div
              className={`mini-drop-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
            >
              <span>+ Drop files here or click to add more documents</span>
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
