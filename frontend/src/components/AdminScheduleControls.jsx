import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE } from '../utils/api'
import './AdminScheduleControls.css'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function todayIso() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function AdminScheduleControls({ onClose }) {
  const [activeTab, setActiveTab] = useState('notes')

  return (
    <div className="admin-settings-overlay" onClick={onClose}>
      <div className="admin-settings-dialog asc-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="admin-settings-header">
          <h2>Schedule Controls</h2>
          <button className="asc-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="asc-tabs" role="tablist">
          <button
            type="button"
            className={activeTab === 'notes' ? 'active' : ''}
            onClick={() => setActiveTab('notes')}
          >
            Day Notes
          </button>
          <button
            type="button"
            className={activeTab === 'publish' ? 'active' : ''}
            onClick={() => setActiveTab('publish')}
          >
            Publish
          </button>
        </div>
        <div className="asc-body">
          {activeTab === 'notes' ? <NotesTab /> : <PublishTab />}
        </div>
      </div>
    </div>
  )
}

function NotesTab() {
  const [date, setDate] = useState(todayIso())
  const [notes, setNotes] = useState([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function loadNotes(targetDate) {
    setBusy(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE}/day-notes`, {
        params: { from: targetDate, to: targetDate },
      })
      setNotes(response.data || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { loadNotes(date) }, [date])

  async function addNote(event) {
    event.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    setError(null)
    try {
      await axios.post(`${API_BASE}/admin/day-notes`, { date, body: body.trim(), author: 'Admin' })
      setBody('')
      await loadNotes(date)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeNote(id) {
    if (!confirm('Delete this note?')) return
    setBusy(true)
    try {
      await axios.delete(`${API_BASE}/admin/day-notes/${id}`)
      await loadNotes(date)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="asc-section">
      <label className="asc-field">
        <span>Date</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>

      <form onSubmit={addNote} className="asc-note-form">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a note for this day (e.g., Holiday — double coverage)"
          rows="3"
        />
        <button type="submit" disabled={busy || !body.trim()}>
          {busy ? 'Saving…' : 'Add note'}
        </button>
      </form>

      {error && <div className="asc-error">{error}</div>}

      <div className="asc-note-list">
        {notes.length === 0 && !busy && <p className="asc-muted">No notes on this date.</p>}
        {notes.map((note) => (
          <div className="asc-note" key={note.id}>
            <div>{note.body}</div>
            <button type="button" onClick={() => removeNote(note.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PublishTab() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  function adminPassword() {
    return window.prompt('Admin password:') || ''
  }

  async function runPreview() {
    setError(null)
    setResult(null)
    setPreview(null)
    const password = adminPassword()
    if (!password) return
    setBusy(true)
    try {
      const response = await axios.post(
        `${API_BASE}/admin/publish/preview`,
        { month, year },
        { headers: { 'x-admin-password': password } }
      )
      setPreview({ ...response.data, password })
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setBusy(false)
    }
  }

  async function commit() {
    if (!preview) return
    if (!confirm(`Send ${preview.recipients.length} email(s)?`)) return
    setBusy(true)
    setError(null)
    try {
      const response = await axios.post(
        `${API_BASE}/admin/publish/commit`,
        { month, year },
        { headers: { 'x-admin-password': preview.password } }
      )
      setResult(response.data)
      setPreview(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="asc-section">
      <div className="asc-row">
        <label className="asc-field">
          <span>Month</span>
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>
            {monthNames.map((name, index) => (
              <option key={name} value={index}>{name}</option>
            ))}
          </select>
        </label>
        <label className="asc-field">
          <span>Year</span>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {yearOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <button type="button" className="asc-primary" onClick={runPreview} disabled={busy}>
          {busy ? 'Working…' : 'Preview publish'}
        </button>
      </div>

      {error && <div className="asc-error">{error}</div>}

      {preview && (
        <div className="asc-preview">
          <p className="asc-summary">
            <strong>{preview.monthName} {preview.year}</strong> — {preview.firstPublish ? 'first publish' : 'republish (changes only)'}.
            {' '}{preview.recipients.length} recipient{preview.recipients.length === 1 ? '' : 's'}.
            {preview.missingEmails.length > 0 && ` ${preview.missingEmails.length} provider(s) missing email.`}
          </p>
          {preview.recipients.length > 0 && (
            <ul className="asc-recipient-list">
              {preview.recipients.map((recipient) => (
                <li key={recipient.email}>
                  <strong>{recipient.name}</strong> &lt;{recipient.email}&gt; — {recipient.kind === 'month-posted'
                    ? 'month posted'
                    : `added [${recipient.added.join(', ') || '—'}], removed [${recipient.removed.join(', ') || '—'}]`}
                </li>
              ))}
            </ul>
          )}
          {preview.missingEmails.length > 0 && (
            <p className="asc-muted">No email on file: {preview.missingEmails.join(', ')}</p>
          )}
          <button type="button" className="asc-primary" onClick={commit} disabled={busy || preview.recipients.length === 0}>
            {busy ? 'Sending…' : `Send ${preview.recipients.length} email(s)`}
          </button>
        </div>
      )}

      {result && (
        <div className="asc-result">
          <p>
            Sent {result.sent.length} ✓ · Failed {result.failed.length} · Missing emails {result.missingEmails.length}
          </p>
          {result.failed.length > 0 && (
            <ul className="asc-recipient-list">
              {result.failed.map((entry, index) => (
                <li key={`${entry.email}-${index}`}>
                  <strong>{entry.name}</strong> &lt;{entry.email}&gt; — {entry.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminScheduleControls
