import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import './HospitalistPager.css'
import { API_BASE } from '../utils/api'

const BEDS = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '10', value: '10' },
  { label: '11', value: '11' },
  { label: '12', value: '12' },
  { label: '14', value: '14' },
]

const FAST_TRACK_BEDS = [
  { label: 'FT1', value: 'FT1' },
  { label: 'FT2', value: 'FT2' },
  { label: 'FT3', value: 'FT3' },
  { label: 'FT4', value: 'FT4' },
  { label: 'FT5', value: 'FT5' },
]

const PROVIDERS = [
  'Dr. Alford',
  'Dr. Anderson',
  'Dr. Beck',
  'Dr. Boylan',
  'Dr. Epema',
  'Dr. Hakala',
  'Dr. Lucas',
  'Dr. Watts',
  'Toni Gutierrez, NP',
  'Kirsten McGuire, NP',
  'Teri Ficken, NP',
  'Angie Reffitt, NP',
]

const MAX_CHARS = 240

function HospitalistPager() {
  const [selectedBeds, setSelectedBeds] = useState(new Set())
  const [senderName, setSenderName] = useState(() => {
    return localStorage.getItem('pager-sender-name') || ''
  })
  const [diagnosis, setDiagnosis] = useState('')
  const [sendStatus, setSendStatus] = useState(null) // null | 'sending' | 'success' | 'error'
  const [sendError, setSendError] = useState('')

  // Persist sender name to localStorage
  useEffect(() => {
    localStorage.setItem('pager-sender-name', senderName)
  }, [senderName])

  // Auto-clear success banner after 8 seconds
  useEffect(() => {
    if (sendStatus === 'success') {
      const timer = setTimeout(() => setSendStatus(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [sendStatus])

  const toggleBed = (value) => {
    setSelectedBeds(prev => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  const clearBeds = () => {
    setSelectedBeds(new Set())
  }

  const sortedBeds = useMemo(() => {
    const beds = [...selectedBeds]
    beds.sort((a, b) => {
      const aFT = a.startsWith('FT')
      const bFT = b.startsWith('FT')
      if (aFT && !bFT) return 1
      if (!aFT && bFT) return -1
      if (aFT && bFT) return parseInt(a.slice(2)) - parseInt(b.slice(2))
      return parseInt(a) - parseInt(b)
    })
    return beds
  }, [selectedBeds])

  const messagePreview = useMemo(() => {
    const parts = []
    if (senderName.trim()) parts.push(senderName.trim())
    if (sortedBeds.length > 0) parts.push(`Bed ${sortedBeds.join(', ')}`)
    if (diagnosis.trim()) parts.push(diagnosis.trim())
    return parts.join(' - ')
  }, [senderName, sortedBeds, diagnosis])

  const charCount = messagePreview.length
  const isOverLimit = charCount > MAX_CHARS
  const isValid = selectedBeds.size > 0 && senderName.trim() && diagnosis.trim() && !isOverLimit
  const canSend = isValid && sendStatus !== 'sending'

  const handleSend = async () => {
    if (!canSend) return
    setSendStatus('sending')
    setSendError('')

    try {
      const response = await axios.post(`${API_BASE}/page-hospitalist`, {
        senderName: senderName.trim(),
        message: messagePreview,
      })
      if (response.data.success) {
        setSendStatus('success')
        setSelectedBeds(new Set())
        setDiagnosis('')
      } else {
        setSendStatus('error')
        setSendError(response.data.error || 'Unknown error')
      }
    } catch (error) {
      setSendStatus('error')
      const msg = error.response?.data?.error || error.message || 'Failed to send page'
      setSendError(msg)
    }
  }

  const handleRetry = () => {
    setSendStatus(null)
    setSendError('')
  }

  return (
    <div className="pager-container">
      <h2 className="pager-title">{'\u{1F4DF}'} Page Hospitalist</h2>

      {/* Status Banners */}
      {sendStatus === 'success' && (
        <div className="pager-status-success">
          Page sent successfully
        </div>
      )}
      {sendStatus === 'error' && (
        <div className="pager-status-error">
          <span>{sendError}</span>
          <button className="pager-retry-btn" onClick={handleRetry}>Retry</button>
        </div>
      )}

      {/* Bed Selection */}
      <div className="pager-field">
        <div className="pager-field-header">
          <label className="pager-label">Select Bed(s)</label>
          {selectedBeds.size > 0 && (
            <button className="pager-clear-btn" onClick={clearBeds}>
              Clear ({selectedBeds.size})
            </button>
          )}
        </div>
        <div className="pager-bed-grid">
          {BEDS.map(bed => (
            <button
              key={bed.value}
              className={`pager-bed-chip${selectedBeds.has(bed.value) ? ' selected' : ''}`}
              onClick={() => toggleBed(bed.value)}
              type="button"
            >
              {bed.label}
            </button>
          ))}
        </div>
        <div className="pager-bed-divider" />
        <div className="pager-bed-grid">
          {FAST_TRACK_BEDS.map(bed => (
            <button
              key={bed.value}
              className={`pager-bed-chip${selectedBeds.has(bed.value) ? ' selected' : ''}`}
              onClick={() => toggleBed(bed.value)}
              type="button"
            >
              {bed.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sender Name */}
      <div className="pager-field">
        <label className="pager-label" htmlFor="pager-sender">Your Name</label>
        <select
          id="pager-sender"
          className="pager-input"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
        >
          <option value="">-- Select Provider --</option>
          {PROVIDERS.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Diagnosis / Reason */}
      <div className="pager-field">
        <label className="pager-label" htmlFor="pager-diagnosis">Diagnosis / Reason</label>
        <input
          id="pager-diagnosis"
          type="text"
          className="pager-input"
          placeholder="Sepsis, AKI, needs admission"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      </div>

      {/* Message Preview */}
      <div className="pager-field">
        <label className="pager-label">Message Preview</label>
        <div className={`pager-preview${isOverLimit ? ' over-limit' : ''}`}>
          {messagePreview || '\u00A0'}
        </div>
        <div className={`pager-char-count${isOverLimit ? ' over-limit' : ''}`}>
          {charCount} / {MAX_CHARS}
        </div>
      </div>

      {/* Send Button */}
      <button
        className="pager-send-btn"
        disabled={!canSend}
        onClick={handleSend}
        type="button"
      >
        {sendStatus === 'sending' ? (
          <>
            <span className="pager-spinner" />
            Sending...
          </>
        ) : (
          <>{'\u{1F4DF}'} Send Page</>
        )}
      </button>
    </div>
  )
}

export default HospitalistPager
