import './ConfirmModal.css'

function ConfirmModal({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button onClick={onCancel} className="confirm-btn confirm-btn-cancel">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`confirm-btn confirm-btn-${variant}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
